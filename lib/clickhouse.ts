import { Readable } from "stream";
import { createClient } from "@clickhouse/client";
import type { ClickHouseClient, InsertParams, InsertResult } from "@clickhouse/client";

export const clickhouseEnabled = process.env.CLICKHOUSE_ENABLED === "true";

export const getClickHouseHosts = () => {
	return (process.env.CLICKHOUSE_HOSTS || "")
		.split(",")
		.map((host) => host.trim())
		.filter(Boolean);
};

export const getClickHouseHost = () => getClickHouseHosts()[0];

export const getClient = (): ClickHouseClient => {
	return createClient({
		url: getClickHouseHost(),
		username: process.env.CLICKHOUSE_USER ?? "default",
		password: process.env.CLICKHOUSE_PASSWORD ?? "",
		request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? "100000"),
	}) as ClickHouseClient;
};

export const QUERY_COMMENT = '/* { "client": "xerac-insights" } */ ';

export const insert = async <T>(params: InsertParams<Readable, T>): Promise<InsertResult | null> => {
    return clickhouseEnabled ? await getClient().insert(params) : null;
}
