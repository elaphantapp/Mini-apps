
var AGENT_URL_TEST = "https://api-wallet-did-testnet.elastos.org"
var AGENT_URL_PRODUCE = "https://api-wallet-did.elastos.org"

const AGENT_URL = AGENT_URL_PRODUCE

const accId = "Z0BDGNkGzkD0fBY"
const accSecret = "7OyvLKvkfxp8AC6eJr5OXF00dRqVoS"

var createDidInfo = (key, value, did) => {
    return {
        "Tag": "DID Property",
        "Ver": "1.0",
        "Status": "Normal",
        "Did": did,
        "Properties": [{
             "Key": key,
             "Value": value,
             "Status": "Normal"
        }]
    }
}

var uploadMemo = (accId, accSecret, key, value, seed, privateKey) => {
    var masterPublicKey = getMasterPublicKey(seed)
    var publicKey = generateSubPublicKey(masterPublicKey, EXTERNAL_CHAIN, 0).toString('hex')
    var did = getDid(publicKey).toString()

    var didInfo = JSON.stringify(createDidInfo(key, value, did))
    console.log("upload didinfo: " + didInfo)
    var memo = {
        "msg": toBinary(didInfo),
        "pub": publicKey,
        "sig": sign(didInfo, privateKey)
    }

    var time = new Date().getTime().toString()
    var hmac = CryptoJS.MD5(time + accSecret)

    var auth = {
        "auth": hmac.toString(),
        "id": accId,
        "time": time
    }

    console.log(JSON.stringify(auth))

    // /api/2/blockagent/upchain/data
    return fetch(AGENT_URL + "/api/1/blockagent/upchain/data", {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Elastos-Agent-Auth': JSON.stringify(auth)
        },
        body: JSON.stringify(memo)
    })
    .then(response => response.json())
    .then(response => {
        console.log("upload did info response: " + JSON.stringify(response))

        if (response.status === 200) {
            return {
                "txid": response.result,
                "value": value
            }
        }

        return {}
    })
    .catch(function(error) {
        console.log(error);
    })
}

const restoreDid = mnemonic => {
    var seed = getSeedFromMnemonic(mnemonic)
    var privateKey = generateSubPrivateKey(seed, COIN_TYPE_ELA, EXTERNAL_CHAIN, 0).toString('hex')
    var masterPublicKey = getMasterPublicKey(seed)
    var publicKey = generateSubPublicKey(masterPublicKey, EXTERNAL_CHAIN, 0).toString('hex')
    var did = getDid(publicKey).toString()

    return {
        "mnemonic": mnemonic,
        "privateKey": privateKey,
        "publicKey": publicKey,
        "did": did
    }
}

const createDid = () => {
    var mnemonic = generateMnemonic()
    return restoreDid(mnemonic)
}

const setInfo = (accId, accSecret, key, value, mnemonic) => {
    var seed = getSeedFromMnemonic(mnemonic)
    var privateKey = generateSubPrivateKey(seed, COIN_TYPE_ELA, EXTERNAL_CHAIN, 0).toString('hex')

    return uploadMemo(accId, accSecret, key, value, seed, privateKey)
}
