scp -i ./finance-calendar_key.pem -r ./ azureuser@172.171.243.235:~/game
scp -i ../finance-calendar_key.pem -r ./src/components azureuser@172.171.243.235:~/game/components
ssh ../finance-calendar_key.pem azureuser@172.171.243.235