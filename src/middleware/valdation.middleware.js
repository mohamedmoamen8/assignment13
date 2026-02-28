const data = ["body", "query", "params"];
export const validation = (schema) => {
  return (req, res, next) => {
    const validationErrors=[]
    data.forEach((ele) => {
      if (schema[ele]) {
        const valdationRes= schema[ele].validate(req[ele]);          
        if (valdationRes.error) {
          validationErrors.push(valdationRes.error);
        }
      }
    });
    if (validationErrors.length > 0) {
      return res.status(423).json({
        message: "Validation error",
        errors: validationErrors.map((err) => err.details),
      });
    } else {
      return next();
    }
  };
};
