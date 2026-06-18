export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Sends error to Global Handler
  };
};

