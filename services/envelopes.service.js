const db = require('./db');
const moment = require('moment');

const date = moment().format('YYYY-MM-DD HH:mm:ss');

class EnvelopesService {

	async getAllEnvelopes() {
		const query = 'SELECT * FROM envelopes';
		const envelopes = await db.query(query);
		return envelopes;
	}

	async getEnvelopeById(id) {
		const query = 'SELECT * FROM envelopes WHERE id = $1';
		const envelope = await db.query(query, [id]);
		return envelope;
	}

	async createEnvelope(title, balance) {
		if (!balance) {
			balance = 0;
		}
		const query = 'INSERT INTO envelopes(title, balance) VALUES($1, $2) RETURNING *';
		const newEnvelope = await db.query(query, [title, balance]);
		return newEnvelope;
	}

	async updateEnvelopeById(id, title, balance) {
		const query = 'UPDATE envelopes SET title = $1, balance = $2 WHERE id = $3 RETURNING *'
		const updatedEnvelope = await db.query(query, [title, balance, id]);
		return updatedEnvelope;
	}

	async deleteEvelopeById(id) {
		const query = 'DELETE FROM envelopes WHERE id = $1';
		await db.query(query, [id]);
		return;
	}


	async createEnvelopeTransation(id, title, amount) {
		const transactionQuery = 'INSERT INTO transactions(title, amount, envelope_id) VALUES($1, $2, $3) RETURNING *';
		const updateEnvelopeQuery = 'UPDATE envelopes SET balance = balance - $1 WHERE id = $2 RETURNING *';

		const client = await db.getClient();

		try {
			await client.query('BEGIN');

			const newTransaction = await client.query(transactionQuery, [title, amount, id]);

			await client.query(updateEnvelopeQuery, [amount, id]);

			await client.query('COMMIT');
			await client.end();

			return newTransaction;
		} catch (err) {
			await client.query('ROLLBACK');
			await client.end();

			throw err;
		}
	}

	async getEnvelopeTransactions(id) {
		const query = 'SELECT * FROM transactions WHERE sender_envelope_id = $1';
		const transactions = await db.query(query, [id]);
		return transactions;
	}
}

module.exports = new EnvelopesService();