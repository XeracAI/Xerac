import 'server-only'

import { count, execute } from '@/lib/db/queries'
import { sql } from 'drizzle-orm'
import { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core';

// Charset for generating referral codes. Removed 0 (zero), O (capital letter for o), 1 (one) and I (capital letter for i) for more clarity.
const referralCharset: string = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCode(length: number): string {
	let code: string = "";
	for (let i = 0; i < length; ++i) {
		code += referralCharset.charAt(Math.floor(Math.random() * referralCharset.length));
	}
	return code;
}

export async function generateUniqueCode<T extends TableConfig>(model: PgTableWithColumns<T>, field: keyof T['columns']) {
	let length = Math.ceil(Math.log10(await count(model))) + 1;
	if (length < 4) length = 4;
	let code;
	while (true) {
		code = generateCode(length);

		const [row] = await execute(sql`select exists (select 1 from ${model} where ${field} = ${code}) as isCodeDuplicate`);
		if (!row.iscodeduplicate) {
			return code;
		}
	}
}
