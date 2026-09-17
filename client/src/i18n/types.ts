export interface SelLike {
  hasIssue: boolean;
  statusLabel: string;
  wo: string;
  vendor: string;
  etaFmt: string;
  next: string;
  nextFmt: string;
  faults: number;
  ageDays: number | null;
  costToDateFmt: string;
  partner: string;
}

export interface Dict {
  sidebarLabel: string;
  topbar: { switchLabel: string; export: string; import: string; search: string; logFault: string };
  fleetTable: { id: string; type: string; brandModel: string; serial: string; zone: string; hours: string; status: string; next: string; costToDate: string; currentIssue: string; assetsOf: (n: number, total: number) => string };
  fleetEmpty: { title: string; body: string; button: string };
  detailEmpty: { title: string; body: string };
  print: { downloadPdf: string; close: string; scanLive: string; scanQrTag: string };
  reportsScreen: {
    periodLabel: string;
    ytdBadge: (fromMonth: string, toMonth: string, year: number) => string;
    exportCsv: string;
    downtimeTitle: string;
    downtimeSub: string;
    spendTitle: string;
    spendSub: string;
    costTableTitle: string;
    costTableSub: string;
    costTable: { unit: string; brandModel: string; serial: string; age: string; faults: string; mtbf: string; downtime: string; costYtd: string; costToDate: string };
  };
  log: {
    stageOpsLabel: string;
    stageOpsSub: string;
    stageEngLabel: string;
    stageEngSub: string;
    opsForm: {
      title: string;
      stepOf: string;
      equipment: string;
      hoursAtFault: string;
      reportedBy: string;
      reportedByHint: string;
      pickReporter: string;
      howReported: string;
      whenNoticed: string;
      whatObserved: string;
      whatObservedPh: string;
      symptomsOnly: string;
      effectOnOps: string;
      takenOutNow: string;
      attachments: string;
      attachmentsHint: string;
      attachBtn: string;
      submitNote: string;
      cancel: string;
      submitBtn: string;
    };
    sidebar: {
      selectedUnit: string;
      reportedBy: string;
      loggedBy: string;
      pendingNotice: string;
      recentFaultsTitle: string;
    };
    engStage: {
      awaitingTitle: string;
      awaitingSub: string;
      nothingWaiting: string;
      opsReportTitle: string;
      readOnlyNote: string;
      reviewingEngineer: string;
      pickEngineer: string;
      inspectedOn: string;
      decisionLabel: string;
      diagnosis: string;
      diagnosisPh: string;
      faultCategory: string;
      partsLabel: string;
      partNamePh: string;
      qtyPh: string;
      costPh: string;
      partsCountSuffix: string;
      commonPartsLabel: string;
      severity: string;
      priority: string;
      whoFixes: string;
      quotesLabel: string;
      quotesHint: string;
      awardCol: string;
      companyPh: string;
      pricePh: string;
      leadPh: string;
      notePh: string;
      leaveBlankNote: string;
      awardedTo: string;
      expectedReturn: string;
      woNumber: string;
      technician: string;
      workshopBay: string;
      expectedCompletion: string;
      partsSource: string;
      rejectNote: string;
      rejectNotePh: string;
      cancel: string;
      noReportsTitle: string;
      noReportsBody: string;
    };
  };
  vendors: {
    offsite: string;
    openWo: string;
    turnaroundLabel: string;
    spendYtd: string;
    addCompanyTitle: string;
    addCompanySub: string;
    addForm: {
      title: string;
      name: string;
      namePh: string;
      covers: string;
      coversPh: string;
      arrangement: string;
      contact: string;
      role: string;
      rolePh: string;
      phone: string;
      phonePh: string;
      email: string;
      offers: string;
      offersHint: string;
      offersPh: string;
      cancel: string;
      save: string;
    };
    openWorkOrdersTitle: string;
    woTable: { wo: string; unit: string; fault: string; parts: string; handledBy: string; sent: string; expected: string; cost: string };
    allCompaniesBack: string;
    partnerSince: string;
    avgTurnaround: string;
    editDetailsBtn: string;
    newWorkOrderBtn: string;
    ourContactTitle: string;
    phoneLabel: string;
    emailLabel: string;
    escalationLabel: string;
    offersTermsTitle: string;
    moneySpentTitle: string;
    ytdInclQuotes: string;
    lifetimeSpend: string;
    openQuotesLabel: string;
    woCountLabel: string;
    avgWoLabel: string;
    woHistoryTitle: string;
    historyTable: { date: string; unit: string; work: string; wo: string; cost: string };
    equipmentCareTitle: string;
    assetsCountSuffix: string;
  };
  schedule: {
    legendScheduled: string;
    legendOverdue: string;
    legendReturns: string;
    upcomingTitle: string;
    upcomingSub: string;
    intervalsTitle: string;
  };
  detail: {
    backToFleet: string;
    serialLabel: string;
    nextServiceLabel: string;
    qrTagBtn: string;
    printReportBtn: string;
    logFaultBtn: string;
    openWorkOrderTitle: string;
    partsCol: string;
    qtyCol: string;
    costCol: string;
    quotesComparedLabel: string;
    warrantyNotesCol: string;
    serviceHistoryTitle: string;
    histTable: { date: string; workDone: string; company: string; wo: string; cost: string };
    totalCostToDate: string;
    pastRecordsTitle: string;
    pastRecordsSub: string;
    addRecordBtn: string;
    svcForm: {
      date: string;
      typeOfWork: string;
      workCarriedOut: string;
      workPh: string;
      detail: string;
      detailPh: string;
      company: string;
      companyPh: string;
      woInvoice: string;
      cost: string;
      cancel: string;
      save: string;
    };
    assetRecordTitle: string;
    planCardTitle: string;
  };
  report: {
    orgLine: string;
    docTitle: string;
    issuedOn: (reportNo: string, date: string) => string;
    section1: string;
    section2: string;
    openWorkOrder: string;
    handledBy: string;
    sentLogged: string;
    expectedReturn: string;
    quotedTotal: string;
    partCol: string;
    qtyCol: string;
    unitPriceCol: string;
    lineTotalCol: string;
    labourTransport: string;
    totalQuoted: string;
    quotesCompared: string;
    companyCol: string;
    coversCol: string;
    priceCol: string;
    leadCol: string;
    decisionCol: string;
    serviceHistory: string;
    entriesSince: (count: number, date: string) => string;
    dateCol: string;
    typeCol: string;
    workCol: string;
    woCol: string;
    costCol: string;
    totalSpent: string;
    notesRecommendation: string;
    reviewedBy: string;
    footerOrg: string;
  };
  types: Record<string, string>;
  plural: Record<string, string>;
  common: Record<string, string>;
  st: Record<'reported' | 'operational' | 'due' | 'maintenance' | 'vendor' | 'parts' | 'out', string>;
  months: string[];
  weekdays: string[];
  hrs: string;
  cycles: string;
  yrs: string;
  mons: string;
  days: string;
  tbd: string;
  hourMeter: string;
  cycleCount: string;
  sinceHours: string;
  sinceCycles: string;
  notSet: string;
  overdue: string;
  overdueSince: string;
  nextSvc: string;
  noPlan: string;
  every: string;
  or: string;
  active: string;
  expired: string;
  listSep: string;
  unspecifiedPart: string;
  inHouseName: string;
  confirmed: string;
  defaultComplaint: string;
  commissionDesc: string;
  generatedOn: string;
  nav: Record<'fleet' | 'add' | 'detail' | 'schedule' | 'vendors' | 'log' | 'reports', string>;
  title: Record<'fleet' | 'add' | 'detail' | 'schedule' | 'vendors' | 'log' | 'people' | 'reports', string>;
  subtitle: Record<'fleet' | 'add' | 'schedule' | 'vendors' | 'log' | 'people' | 'reports', string>;
  stat: Record<
    | 'total'
    | 'totalEmpty'
    | 'pending'
    | 'pendingSub'
    | 'operational'
    | 'avail'
    | 'due'
    | 'overdue'
    | 'offsite'
    | 'awaiting'
    | 'out'
    | 'outSub',
    string
  >;
  allTypes: string;
  anyStatus: string;
  view: Record<'table' | 'cards' | 'kanban' | 'timeline', string>;
  f: Record<
    | 'brand'
    | 'model'
    | 'serial'
    | 'zone'
    | 'purchased'
    | 'warranty'
    | 'partner'
    | 'age'
    | 'status'
    | 'reportedBy'
    | 'channel'
    | 'reportedOn'
    | 'impact',
    string
  >;
  kpi: Record<
    | 'costToDate'
    | 'costToDateSub'
    | 'costYtd'
    | 'thisYear'
    | 'inclQuote'
    | 'faults'
    | 'oneOpen'
    | 'noneOpen'
    | 'mtbf'
    | 'over'
    | 'noFaults',
    string
  >;
  p: Record<'plan' | 'interval' | 'last' | 'next', string>;
  cal: Record<'service' | 'returns' | 'calendarTrigger', string>;
  kind: Record<'preventive' | 'breakdown' | 'commission', string>;
  scopes: string[];
  q: Record<
    'received' | 'none' | 'lowest' | 'fastest' | 'noAward' | 'awardedTag' | 'notAwarded' | 'compared',
    string
  >;
  roles: Record<'admin' | 'ops' | 'engineer' | 'operator', string>;
  login: Record<
    | 'title'
    | 'sub'
    | 'who'
    | 'pick'
    | 'pin'
    | 'pinPh'
    | 'signIn'
    | 'wrong'
    | 'firstRun'
    | 'noAccounts'
    | 'signOut'
    | 'signedInAs',
    string
  >;
  people: {
    nav: string;
    title: string;
    sub: string;
    addTitle: string;
    name: string;
    role: string;
    jobTitle: string;
    jobPh: string;
    pin: string;
    save: string;
    listTitle: string;
    empty: string;
    remove: string;
    you: string;
    roleHint: Record<'admin' | 'ops' | 'engineer' | 'operator', string>;
    countSuffix: string;
  };
  noAccess: { title: string; body: string };
  pickReporter: string;
  pickEngineer: string;
  noneYet: string;
  contracts: string[];
  cats: string[];
  sev: [string, string][];
  channels: string[];
  impacts: string[];
  priorities: string[];
  bays: string[];
  sources: string[];
  stopYes: string;
  stopNo: string;
  stage: Record<'ops' | 'opsSub' | 'eng' | 'engSub', string>;
  dec: Record<'approve' | 'approveSub' | 'reject' | 'rejectSub', string>;
  eng: Record<'becomes' | 'returnsTo' | 'subOut' | 'subIn' | 'subReject', string>;
  route: Record<'out' | 'outSub' | 'in' | 'inSub', string>;
  rep: Record<'downtime' | 'downtimeSub' | 'spend' | 'spendSub' | 'avail' | 'availSub' | 'mtbf' | 'mtbfSub' | 'openWo' | 'offsite', string>;
  hint: Record<'report' | 'qr', string>;
  downNote: (type: string, share: number) => string;
  downEmpty: string;
  notes: (sel: SelLike) => string[];
}
