/*
* @Author: yulongyang
* @Email: anziguoer@sina.com
* @Date:   2016-09-27 16:30:51
* @Last Modified by:   yulongyang
* @Last Modified time: 2016-09-27 16:41:10
* @Descrition : 阿里云 api 网关签名
*/
"use strict";
var querystring = require('querystring');
var crypto = require('crypto');
// 定义 key 和 secret
const KEY = '60022326';
const SECRET = '455e18e3b99daab875364fe4a3761e54';

module.exports = function( requestParams, callBack ){
    // Content-Type、Accept、Content-MD5、Date, 这三个是基础的签名字符串， 必须包含
    const defaultSignObj = {
        'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept' : 'application/json; charset=UTF-8',
        'Content-MD5' : '',
        'Date' : new Date(),
        'Method' : 'GET',
        'X-Ca-Stage' : 'TEST',
        'X-Ca-Key': KEY,
        'X-Ca-Nonce' : getNonce(),
        'X-Ca-Timestamp' : new Date().getTime(),
        'V-App-Client-Information' : "app_name:hxwx|plat:win32|ver:3.3|device:wap|os:node|channel_name:wap|udid:"+new Date().getTime()+"|client_ip:192.168.0.1|user-agent:test", //此字段根据自己的 api 的定义选择传递
        'X-Ca-Signature-Headers' : 'X-Ca-Key,X-Ca-Nonce,X-Ca-Stage,X-Ca-Timestamp',
    };

    requestParams = Object.assign(defaultSignObj, requestParams);
    var stringToSign = requestParams.Method.toUpperCase()+"\n"+requestParams.Accept+"\n"+requestParams['Content-MD5']+"\n"+requestParams['Content-Type']+"\n"+requestParams.Date+"\n";

    // 检查参数签名的定义参数, 获取签名的参数
    var signatureHeaders = requestParams['X-Ca-Signature-Headers'].split(',');
    if(signatureHeaders.length > 0){
        var Headers = {};
        signatureHeaders.forEach(function(val, key){
            Headers[val] = requestParams[val];
        });
        // 按照字典对 Key 进行排序
        var keys = Object.keys(Headers);
        var newKeys = keys.sort();
        var newHeaders = {};
        newKeys.forEach(function(val, key){
            stringToSign += val + ':' +requestParams[val]+"\n";
        });
        // 将 url 拼接上
        stringToSign += requestParams.Path;
        // 如果有参数传递， 测排序后拼接参数
        if(requestParams.Form){
            var newForm = {};
            // 按照字典对 Key 进行排序
            Object.keys(requestParams.Form).sort().forEach(function(bVal, bKey){
                 newForm[bVal] = requestParams.Form[bVal];
            });
            stringToSign += '?'+querystring.stringify(newForm);
        }

        requestParams['X-Ca-Signature'] = getSignature(stringToSign);
        delete requestParams.Form;
        callBack(null, requestParams);
    } else {
        callBack('X-Ca-Signature-Headers is required');
    }
};

//请求唯一标识，15分钟内AppKey+API+Nonce不能重复，与时间戳结合使用才能起到防重放作用
function getNonce(){
    return Math.random().toString(36).substr(2, 15);
    // 此处如果 nonce 硬编码了， 接口会返回 Nonce used。
}

/**
 * 获取签名
 */
function getSignature(stringToSign){
    return crypto.createHmac('sha256',SECRET).update(stringToSign, 'utf8').digest('base64');
}