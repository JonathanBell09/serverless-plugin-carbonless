'use strict';

/** Generated by Serverless Plugin Carbonless **/

module.exports.carbonlessRouter = async (event) => {
    const aws = require('aws-sdk');
    
    // Check where function is deployed
    const regions = ['us-east-1', 'eu-west-1'];
    const regionsWithFunction = [];
    for (let i=0; i < regions.length; i++){
        const lambda = new aws.Lambda({region: regions[i]});
        try{
            const result = await lambda.getFunction({FunctionName: 'example-serverless-dev-hello'}).promise();
            // If doesn't throw error then function is in this region
            regionsWithFunction.push(regions[i]);
        } catch (err){
            // function not in this region
        }
    }
    
    console.log(`Regions with function example-serverless-dev-hello are ${regionsWithFunction}`)

    // Check where carbon intensity is lowest
    let bestRegion;
    let minCarbonIntensity;
    for (let i=0; i < regionsWithFunction.length; i++){
        try {
            const result = await getRegionCarbonIntensity('eastus');
            const carbonIntensity = result[0]['forecastData'][0]['value'];
            console.log(`carbonIntensity in ${regionsWithFunction[i]} is ${carbonIntensity}`);
            if (minCarbonIntensity){
                if (carbonIntensity < minCarbonIntensity){
                    bestRegion = regionsWithFunction[i];
                }
            } else {
                bestRegion = regionsWithFunction[i];
                minCarbonIntensity = carbonIntensity;
            }
        } catch (error){
            console.log(error);
        }   
    }
    
    console.log(`bestRegion is ${bestRegion}`);
};

function getRegionCarbonIntensity(region) {
    const https = require('https');
    const forecastAPI = 'https://carbon-aware-api.azurewebsites.net/emissions/forecasts/current';
    const minutes = 10;
    const dataEndAt = new Date(Date.now() + minutes*60000).toISOString();
    
    return new Promise((resolve, reject) => {
        const req = https.get(forecastAPI + `?location=${region}&dataEndAt=${dataEndAt}`, (res) => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (err) {
                  reject(new Error(err));
                }
            });
        });
        req.on('error', err => {
            reject(new Error(err));
        });
    });
}