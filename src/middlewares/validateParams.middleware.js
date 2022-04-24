import { INVALID_PARAMETERS, MISSING_PARAMETERS } from "../config/errors.js";

// Validates parameters given a params object

// Example structure:
// {
//   firstParam: {
//     type: String,
//     validator: firstParam => firstParam.length > 6
//   },

//   secondParam: { ... }
// }

export default function(params) {
  return function(req, res, next) {
    if (!req.body) return next(MISSING_PARAMETERS);

    for (const [param, { type, validator }] of Object.entries(params)) {
      if (typeof req.body[param] === "undefined") return next(MISSING_PARAMETERS);
      if (req.body[param].constructor !== type || (validator && !validator(req.body[param]))) return next(INVALID_PARAMETERS);
    };

    next();
  }
}