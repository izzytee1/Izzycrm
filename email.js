// Email mock data
// Mock/demo content only. Safe to remove when real data is connected.
window.SAMPLE_DATA = Object.assign(window.SAMPLE_DATA || {}, {
  mailAccounts: [
    { id: 'a1', rep: 'Marcus', name: 'Marcus Webb', email: 'marcus.webb@crm.mail', color: '#3D4F61', signature: '<div>Marcus Webb</div><div>Senior Account Executive · CRM</div>' },
    { id: 'a2', rep: 'Marcus', name: 'Marcus Webb', email: 'mwebb@crm.mail', color: '#0F766E', signature: '<div>Marcus Webb</div><div>CRM</div>' },
    { id: 'a3', rep: 'Sam', name: 'Sam', email: 'sam@crm.mail', color: '#5C6770', signature: '<div>Sam</div><div>CRM</div>' },
    { id: 'a4', rep: 'Sarah', name: 'Sarah Lane', email: 'sarah.lane@crm.mail', color: '#B45309', signature: '<div>Sarah Lane</div><div>Account Executive · CRM</div>' },
    { id: 'a5', rep: 'Mike', name: 'Mike Ortiz', email: 'mike.ortiz@crm.mail', color: '#53606A', signature: '<div>Mike Ortiz</div><div>Account Executive · CRM</div>' }
  ],

  // Email templates, loaded the first time the CRM opens. Campaigns fill in {first}, {last}, {company} and {rep}.
  mailTemplates: [
    { id: 'tp-intro', name: 'Intro — working capital', subject: 'Working capital for {company}',
      html: '<div>Hi {first},</div><div><br></div><div>I work with businesses like {company} that want fast, simple working capital. Most of our clients get an answer within a day.</div><div><br></div><div>Would a quick 10-minute call this week make sense?</div><div><br></div><div>{rep}</div>' },
    { id: 'tp-follow', name: 'Follow up — no reply', subject: 'Following up, {first}',
      html: '<div>Hi {first},</div><div><br></div><div>Just circling back on my last note. If funding is still on your list for {company}, I can have numbers for you in 24 hours.</div><div><br></div><div>{rep}</div>' },
    { id: 'tp-renew', name: 'Renewal check-in', subject: '{company} — renewal options',
      html: '<div>Hi {first},</div><div><br></div><div>You may qualify for a renewal with better terms. Want me to run the numbers?</div><div><br></div><div>{rep}</div>' }
  ],

  // Sample mailbox, loaded the first time the CRM opens. account: its place in mailAccounts (0 = first). mins: minutes ago.
  // out: sent by the account's rep (opens: minutes ago of each open). hi: starts the email with "Hi <first name>," of the lead.
  // mailboxVersion: when the sample mailbox changes, this number goes up and the sample emails are loaded again
  // (emails a rep wrote in new conversations are kept).
  mailboxVersion: 2,
  mailbox: [
    { id: 't-priya-demo', account: 4, folder: 'inbox', msgs: [
      { out: true, peer: 'p.tandon@novalog.io', subject: 'Product demo', hi: true, body: 'Would Wednesday at 11 AM work for the product demo with your engineering team?', mins: 400, opens: [300] },
      { peer: 'p.tandon@novalog.io', subject: 'Re: Product demo', body: 'Hi Mike,\n\nWednesday at 11 works. I will bring two engineers.\n\nThanks,\nPriya', mins: 95, unread: true }] },
    { id: 't-mei-quote', account: 0, folder: 'inbox', starred: true, important: true, msgs: [
      { out: true, peer: 'm.chen@stellarops.com', subject: 'Revised quote — 3-year option', hi: true, body: 'Attached is the revised quote with the 3-year option we discussed.', mins: 2200, opens: [9, 35, 400, 1300, 2100] },
      { peer: 'm.chen@stellarops.com', subject: 'Re: Revised quote — 3-year option', body: 'Hi Marcus,\n\nLegal signed off on the 3-year term. Can you confirm the volume discount is included?\n\nMei', mins: 70, unread: true }] },
    { id: 't-thomas-timeline', account: 3, folder: 'inbox', msgs: [
      { peer: 't.patel@syncwave.io', subject: 'Implementation timeline', body: 'Hi Sarah,\n\nCould you share a rough implementation timeline for 200 seats?\n\nThomas', mins: 130 }] },
    { id: 't-james-payment', account: 2, folder: 'inbox', msgs: [
      { peer: 'j.liao@meridian.com', subject: 'Payment options', body: 'Sam,\n\nOne question on option B — is the first payment due at signing?\n\nJames', mins: 1500 }] },
    { id: 't-rafael-soc2', account: 3, folder: 'inbox', starred: true, msgs: [
      { peer: 'r.gomez@horizoncloud.io', subject: 'SOC2 follow-up', body: 'Hi Sarah,\n\nThanks for the SOC2 report. Our team will review it this week.\n\nRafael', mins: 4100 }] },
    { id: 't-alicia-onboarding', account: 4, folder: 'inbox', msgs: [
      { peer: 'a.hayes@pinnaclehlth.com', subject: 'Onboarding next week', body: 'Hi Mike,\n\nWe are all set for onboarding on Tuesday. Looking forward to it.\n\nAlicia', mins: 9500 }] },
    { id: 't-sandra-demo', account: 0, folder: 'archive', msgs: [
      { out: true, peer: 's.reeves@apexdyn.com', subject: 'Demo invite — enterprise tier', hi: true, body: 'Here is the Zoom link for today’s enterprise tier demo at 4:00 PM.', mins: 300, opens: [20, 140, 290] }] },
    { id: 't-james-proposal', account: 2, folder: 'archive', msgs: [
      { out: true, peer: 'j.liao@meridian.com', subject: 'Proposal — two payment options', hi: true, body: 'The proposal with both payment options is attached for your review.', mins: 2900, opens: [2850] }] },
    { id: 't-priya-deck', account: 4, folder: 'archive', msgs: [
      { out: true, peer: 'p.tandon@novalog.io', subject: 'Overview deck', hi: true, body: 'Sharing our overview deck ahead of the demo.', mins: 9500 }] },
    { id: 't-ben-intro', account: 3, folder: 'archive', msgs: [
      { out: true, peer: 'b.kowalski@evg.tech', subject: 'Intro — CRM', hi: true, body: 'Great speaking with you. Here is a short intro to CRM.', mins: 11600 }] },
    { id: 't-david-intro', account: 2, folder: 'archive', msgs: [
      { out: true, peer: 'd.ruiz@qbridge.ai', subject: 'Intro — CRM', hi: true, body: 'Do you have 10 minutes this week for a quick intro call?', mins: 5800, opens: [5500, 5700] }] },
    { id: 't-alicia-contract', account: 4, folder: 'archive', msgs: [
      { out: true, peer: 'a.hayes@pinnaclehlth.com', subject: 'Contract signed — next steps', hi: true, body: 'Thank you for signing. Next steps for onboarding are below.', mins: 58000, opens: [57000] }] },
    { id: 't-thomas-proposal', account: 3, folder: 'archive', msgs: [
      { out: true, peer: 't.patel@syncwave.io', subject: 'Proposal follow-up', hi: true, body: 'Following up on the proposal we reviewed together.', mins: 150, opens: [95] }] },
    { id: 't-nathan-security', account: 2, folder: 'archive', msgs: [
      { out: true, peer: 'n.kim@vertexsys.com', subject: 'Security summary', hi: true, body: 'Here is the security summary your team asked for.', mins: 8800, opens: [4000, 8700] }] },
    { id: 't-rafael-package', account: 3, folder: 'archive', msgs: [
      { out: true, peer: 'r.gomez@horizoncloud.io', subject: 'Security package — SOC2 report', hi: true, body: 'The SOC2 report and security package are attached.', mins: 4300, opens: [60, 2600, 4200] }] },
    { id: 't-laura-draft', account: 0, folder: 'archive', msgs: [
      { out: true, draft: true, peer: 'l.fischer@orbis.co', subject: 'Case study for Orbis', body: 'Hi Laura,\n\nHere is a case study from a data team like yours.', mins: 60 }] }
  ],
});
