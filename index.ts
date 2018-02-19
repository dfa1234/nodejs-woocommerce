import  * as OAuth   from 'oauth-1.0a';
import  * as crypto  from 'crypto';
import request = require("request");
import conf from './config'
import {CoreOptions, OptionsWithUri, OptionsWithUrl, RequestCallback} from "request";


const getOAuth = () => {
    const data:any = {
        consumer: {
            key: conf.consumerKey,
            secret: conf.consumerSecret
        },
        signature_method: 'HMAC-SHA256',
        hash_function: (base_string:string, key:string) => {
            return crypto.createHmac('sha256', key).update(base_string)
                .digest('base64');
        }
    };

    if (-1 < [ 'v1', 'v2' ].indexOf(conf.version)) {
        data.last_ampersand = false;
    }

    return new OAuth(data);
};


const doRequest = (method:string, endpoint:string, data:any, callback:RequestCallback) => {

    const params:OptionsWithUrl = {
        url: `${conf.url}/${conf.wpAPIPrefix}/${conf.wpAPI}/${endpoint}`,
        method: method,
        encoding: conf.encoding,
        timeout: conf.timeout,
        headers: {
            'User-Agent': 'WooCommerce API TYPESCRIPT/ 1.4.2',
            'Accept': 'application/json'
        }
    };

    if (conf.isSsl) {
        if (conf.queryStringAuth) {
            params.qs = {
                consumer_key: conf.consumerKey,
                consumer_secret: conf.consumerSecret
            };
        } else {
            params.auth = {
                user: conf.consumerKey,
                pass: conf.consumerSecret
            };
        }

        if (!conf.verifySsl) {
            params.strictSSL = false;
        }
    } else {
        params.qs = getOAuth().authorize({
            url: `${conf.url}/${conf.wpAPIPrefix}/${conf.wpAPI}/${endpoint}`,
            method: method
        });
    }

    if (data) {
        if(params.headers)
            params.headers['Content-Type'] = 'application/json;charset=utf-8';
        params.body = JSON.stringify(data);
    }

    if (!callback) {
        return request(params);
    }

    return request(params, callback);
};


export default {
    get:(endpoint:string, callback:RequestCallback) => doRequest('GET', endpoint, null, callback),
    post:(endpoint:string, data:{}, callback:RequestCallback) => doRequest('POST', endpoint, data, callback),
    put:(endpoint:string, data:{}, callback:RequestCallback) => doRequest('PUT', endpoint, data, callback),
    del:(endpoint:string, callback:RequestCallback) => doRequest('DELETE', endpoint, null, callback),
    options:(endpoint:string, callback:RequestCallback) => doRequest('OPTIONS', endpoint, null, callback)
};

