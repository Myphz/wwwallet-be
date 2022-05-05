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

export default function(params, opts) {
  const { error, location="body" } = opts || {};
  return function(req, res, next) {
    if (!req[location]) return next(error || MISSING_PARAMETERS);

    for (const [param, { type, validator }] of Object.entries(params)) {
      if (typeof req[location][param] === "undefined") return next(error || MISSING_PARAMETERS);
      if (req[location][param].constructor !== type || (validator && !validator(req[location][param]))) return next(error || INVALID_PARAMETERS);
    };

    next();
  }
}