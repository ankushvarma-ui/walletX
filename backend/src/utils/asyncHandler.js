/**
 * Async handler for Express routes
 * @param {Function} fn - The async function to handle the request
 * @returns {Function} - The async handler function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;