// TOPBAR Panel 3 mock communications, preserved for V40.
const COMM_DATA = {
  imessageNumbers: new Set(["4153097723","4082291170","5128824177","2125549031","6465550191","3127792241"]),
  messages: [
    ["text","4153097723","out","Hi Sandra, sending the Zoom link for today’s demo.",310,1,false,305],
    ["text","4153097723","in","Perfect, thanks! Can we cover SSO too?",296,1],
    ["text","4153097723","out","Absolutely — I’ll add it to the agenda.",290,1,false,288],
    ["text","2125549031","out","Hi James, the proposal with both payment options is in your inbox.",3000,1,false,2990],
    ["text","2125549031","in","Got it. Reviewing it with the board this week.",2950,1],
    ["text","2125549031","in","Can we move our call to 3:00 PM on Monday?",22,1,true],
    ["text","4082291170","in","Legal is fine with the 3-year term.",1400,2],
    ["text","4082291170","out","Great news! I’ll send the final paperwork today.",1380,2],
    ["wa","4082291170","in","Can you send the volume pricing table here?",200,2],
    ["wa","4082291170","out","Sure — sending it over in a few minutes.",190,2,false,186],
    ["wa","5128824177","out","Hi Rafael, do you have a contact for the pen test?",300,1,false,296],
    ["wa","5128824177","in","Sent the pen test request to our team. We should have it by Friday.",41,1,true],
    ["text","2145550138","in","How long does setup usually take?",100,1],
    ["text","2145550138","out","Most teams are live in 2 weeks. Happy to walk you through it.",92,1],
    ["text","3127792241","out","Hi Priya, confirming Wednesday at 11 AM for the demo.",2000,2,false,1996],
    ["text","3127792241","in","Confirmed 👍",1990,2],
    ["wa","6465550191","out","Hi David, this is Sam from CRM. Do you have 10 minutes this week?",4400,1],
    ["text","4155550170","in","Integration test passed on our side.",330,2,true],
    ["text","5035550187","out","Hi Ben, any update from finance?",1500,1],
    ["wa","6175550127","in","Thanks for the onboarding call!",9000,2]
  ].map((m,i)=>({id:"cm"+i,channel:m[0],number:m[1],dir:m[2],text:m[3],at:Date.now()-m[4]*60000,phone:m[5],unread:!!m[6],status:m[2]!=="out"?"":typeof m[7]==="number"?"read":(m[7]||"delivered"),readAt:typeof m[7]==="number"?Date.now()-m[7]*60000:0,files:[]})),
  calls: [
    ["4082291170","missed",8,0,1],["7865550142","missed",130,0,1],["2125548820","out",180,1320,1],
    ["3127792241","out",190,0,2],["5128824100","out",240,2100,1],["4156673345","in",290,1620,2],
    ["4082298832","out",420,2460,2],["4153097723","in",1500,402,1],["5036614490","out",1510,900,1],
    ["2148835560","missed",2600,0,1],["6174920033","out",11000,1800,2],["3125587712","out",21000,540,1]
  ].map((c,i)=>({id:"cc"+i,number:c[0],dir:c[1],at:Date.now()-c[2]*60000,seconds:c[3],phone:c[4],seen:false}))
};
