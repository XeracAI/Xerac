export const defaultPageLimit: number = parseInt(process.env.DEFAULT_PAGE_LIMIT || '5');

// Setting up number of items to be fetched per page
export const getPagination = (_page: number, _limit?: number) => {
	const limit = _limit ? +_limit : defaultPageLimit;
	const offset = _page ? _page * limit : 0;

	return { limit, offset };
};

// Get paginated data and organise it into totalItems, items, totalPages, currentPage
export const getPagingData = <T,>(
	items: T[],
	totalItems: number,
	page: number,
	limit: number,
): {
	totalItems: number;
	items: T[];
	totalPages: number;
	currentPage: number;
} => {
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return { totalItems, items, totalPages, currentPage };
};
