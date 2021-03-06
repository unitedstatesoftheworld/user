/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const registerUser = require('../../../../admins/registerUser');
const { getContractAndGateway } = require('../../../../helper/fabric/helper/javascript');

const WALLET_PATH = path.join(__dirname, '..', '..', '..', '..', '..', 'wallet');

async function create({
	username,
	publicKey
}) {
	return new Promise(async (resolve, reject) => {
		// create wallet file here
		await registerUser.main(username).catch(reject);
		
		// get identity
		const wallet = JSON.parse(fs.readFileSync(path.join(WALLET_PATH, `${username}.id`)));
	
		// register username
		const {contract, gateway} = await 
			getContractAndGateway({username, chaincode: 'user', contract: 'User'})
				.catch(reject);

		const id = await 
			contract
				.submitTransaction('createUser', username, publicKey)
				.catch(reject);
		
		await gateway.disconnect();

		resolve({wallet, id: id.toString()});

		return;
	})
}

async function shareKeypair({
	sharedWith,
	groupId,
	myEncryptedKeyPair,
	type,
	user
}) {
	return new Promise(async (resolve, reject) => {
		// create wallet
		const walletPath = path.join(__dirname, '../../../../../wallet', `${user.username}.id`);
		fs.writeFileSync(walletPath, JSON.stringify(user.wallet))

		// get contract, submit transaction and disconnect
		var {contract, gateway} = await 
			getContractAndGateway({username: user.username, chaincode: 'user', contract: 'Keypair'})
				.catch(reject);

		var response = await 
			contract
				.submitTransaction('createSharedKeypair', JSON.stringify(sharedWith), groupId, myEncryptedKeyPair, type)
				.catch(reject);

		console.log('Transaction has been submitted', response);

		await gateway.disconnect();
	
		resolve();
		return;
	})
}

async function getKeypair({
	keypairId,
	user
}) {
	return new Promise(async (resolve, reject) => {
		// create wallet
		const walletPath = path.join(__dirname, '../../../../../wallet', `${user.username}.id`);
		fs.writeFileSync(walletPath, JSON.stringify(user.wallet))

		// get contract, submit transaction and disconnect
		var {contract, gateway} = await 
			getContractAndGateway({username: user.username, chaincode: 'user', contract: 'Keypair'})
				.catch(reject);

		// submit transaction
		const rawKeypair = await 
			contract
				.submitTransaction('getKeypair', keypairId)
				.catch(reject);

		const keypair = JSON.parse(rawKeypair.toString('utf8'))

		console.log('Transaction has been submitted');
		
		//disconnect
		await gateway.disconnect();

		resolve(keypair);
		return;
	})
}

module.exports = {
	create,
	shareKeypair,
	getKeypair
}