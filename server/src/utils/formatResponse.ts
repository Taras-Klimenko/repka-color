const formatResponse = function (statusCode: number, message: string, data?: any, error?: any) {
	return { statusCode, message, data, error };
};

export default formatResponse;