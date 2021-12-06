const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

/* Sample req body 

[{
    "variable": "device",
    "value": "{device}",
    "serie": "{time}"
},{
    "variable": "data",
    "value": "{data}",
    "serie": "{time}"
},{
    "variable": "seqNumber",
    "value": "{seqNumber}",
    "serie": "{time}"
}]

*/

exports.decodeAndStore = functions.https.onRequest(async (request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    const data = request.body;
    const data_bytes = data[1]['value'];
    const timestamp = data[1]['serie']

    const to_store = decode(data_bytes, timestamp);

    const writeResult = await admin.firestore().collection('device_data').add(to_store);

    response.json({result: `Message with ID: ${writeResult.id} added.`});
});


function decode(bytes, timestamp) {
    const hex2int = (hex) => {
        let num = 0;
        for (let i = 0; i < hex.length; i += 2) {
            if (i > 0) {
                num = (num << 8);
            }
            num += parseInt(hex.substr(i, 2), 16);
        }
        return num;
    }

    let acc = 0;
    let ans = {};

    const encoding = [
        { name: 'temperature', nbytes: 2, fn: (x) => hex2int(x) / 10 },
        { name: 'ph', nbytes: 1, fn: (x) => hex2int(x) / 10 },
        { name: 'oxygen', nbytes: 2, fn: (x) => hex2int(x) },
        { name: 'turbidity', nbytes: 2, fn: (x) => hex2int(x) },
    ];

    for (const { name, fn, nbytes } of encoding) {
        ans[name] = fn(bytes.substr(acc, nbytes * 2));
        acc += nbytes * 2;
    }

    ans['datetime'] = new Date(timestamp * 1000);;
    

    console.log(ans);

    return ans;
}