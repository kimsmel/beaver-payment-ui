# 03e0810e5fbfbc9787c5cf008763aac4e232865319edc7f4a139bb79b1913f49
base="amount=1&expiredAt=1728442627000&mchId=1&memo=test-memo-1&nonce=172843902707&oid=1&timestamp=1728439027000&uid=1s0FAq9U57zRZqwmohP1NiYbsbdJQKzjY"
printf $base | openssl dgst -sha256
printf $base | sha256sum 