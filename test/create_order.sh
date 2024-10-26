#!/bin/bash

API=http://localhost:8080/api/v1/order

now=$(date +"%s")
nowInMs=$(($now * 1000))
expireAt=$((($now + 3600) * 1000))
nonce=$(date +"%s%S")

uid=3
oid=$1
amount=1
memo=test-memo-1
mchId=1
secret=s0FAq9U57zRZqwmohP1NiYbsbdJQKzjY

base="amount=$amount&expiredAt=$expireAt&mchId=$mchId&memo=$memo&nonce=$nonce&oid=$oid&timestamp=$nowInMs&uid=$uid$secret"
# echo $base

# 这里用echo在mac下有问题，所以用printf
# sign=$(echo -n $base$secret | sha256sum | awk '{print $1}')
# sign=$(echo -n $base | openssl dgst -sha256 | awk '{print $2}')
sign=$(printf $base | openssl dgst -sha256 | awk '{print $2}')
# echo $sign

data='{
    "oid": "'$oid'",
    "uid": "'$uid'",
    "amount": "'$amount'",
    "memo": "'$memo'",
    "expiredAt": '$expireAt',
    "timestamp": '$nowInMs',
    "mchId": "'$mchId'",
    "nonce": "'$nonce'",
    "sign": "'$sign'",
    "callbackUrl": "'$callbackUrl'"
}'

echo $data

curl -X POST $API -H "Content-Type: application/json" -d "$data" | jq .