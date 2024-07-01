const Agenda = require('agenda');
const moment = require('moment-timezone');
const log = require('../utils/logger')(module);
const { AgendaTaskEnum } = require('../enums/agenda-task');
const { Task, Versioning } = require('../models');

module.exports = async (context) => {
  const db = context.mongo;

  // remove any leftover tasks
  await Task.deleteMany();
  // Mark all sync task as Not Running
  await Versioning.updateMany({}, { $set: { running: false } });

  // Start a new instance of agenda
  const agenda = new Agenda({
    defaultLockLifetime: 120000,
    lockLimit: 50,
    processEvery: '1 seconds',
    db: { collection: 'Task' },
    mongo: db,
  });

  // Agenda listeners for starting, error and processing tasks
  agenda.on('ready', async () => {
    log.info('Starting agenda');
    await agenda.start();

    // cleanup old tasks
    const removeJobs = await agenda.jobs({
      name: 'system remove processed tasks',
    });

    if (removeJobs.length === 0) {
      await agenda
        .create('system remove processed tasks')
        .repeatEvery('1 days')
        .schedule(
          moment()
            .utc()
            .add(1, 'days')
            .startOf('day')
            .toDate(),
        )
        .save();
    }

    // start sync processes
    await agenda
      .create('sync')
      .schedule(moment().utc().toDate())
      // .schedule(moment().utc().add(1, 'minutes').toDate())
      .save();
    log.info('Sync tasks will start in a minute!');
  });

  agenda.on('error', (err) => {
    console.error(err);
    log.info('Agenda > Error: ', err);
  });

  agenda.on('success', async (task) => {
    const { data, name } = task.attrs;
    const additionalInfo = '';
    /*
      Sync Classic Deployments ->
      Sync Diamond Deployments ->
      Sync Classic Events ->
      Sync Diamond Events ->
      Sync Classic Marketplace Events ->
      Sync Diamond Marketplace Events
    */
    log.info(`Finished task: ${name}!`, data);
    let nextFunction = '';
    switch (name) {
      case AgendaTaskEnum.SyncContracts:
        nextFunction = AgendaTaskEnum.SyncDiamondContracts;
        break;
      case AgendaTaskEnum.SyncDiamondContracts:
        nextFunction = AgendaTaskEnum.SyncAll721Events;
        break;
      case AgendaTaskEnum.SyncAll721Events:
        nextFunction = AgendaTaskEnum.SyncAllDiamond721Events;
        break;
      case AgendaTaskEnum.SyncAllDiamond721Events:
        nextFunction = AgendaTaskEnum.SyncClassicMarketplaceEvents;
        break;
      case AgendaTaskEnum.SyncClassicMarketplaceEvents:
        nextFunction = AgendaTaskEnum.SyncDiamondMarketplaceEvents;
        break;
      default:
        break;
    }

    log.info(`Completed task ${name}, scheduling next task: ${nextFunction}`);
    await agenda
      .create(nextFunction, data)
      .schedule(moment().utc().toDate())
      .save();

    log.info(
      `Agenda [${name}][${
        task.attrs._id
      }] > processed with data ${JSON.stringify(data)}. ${additionalInfo}`,
    );
  });

  agenda.on('fail', (err) => {
    log.error(`Agenda > Fail: ${JSON.stringify(err)}`);
  });

  // Application termination
  function graceful() {
    agenda.stop(() => {
      log.info('Agenda > Stopping...');
      process.exit(0);
    });
  }

  process.on('SIGTERM', graceful);
  process.on('SIGINT', graceful);
  process.on('unhandledRejection', (err) => {
    log.error(`Unhandled Rejection: ${err}`);
  });

  return agenda;
};
