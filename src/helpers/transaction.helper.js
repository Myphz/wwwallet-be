// Getter function to return any Decimal128 value to String before returning
export function getTransactions(value) {
  const ret = {};

  for (const [crypto, transactions] of value) {
    ret[crypto] = transactions.map(transaction => {
      const newTransaction = {};
      for (const [key, val] of Object.entries(transaction._doc)) {
        newTransaction[key] = val.constructor.name === "Decimal128" ? val.toString() : val;
      }

      return newTransaction;
    });
  }

  return ret;
}

export function findTransactionByID(value, id) {
  for (const [crypto, transactions] of Object.entries(value)) {
    const i = transactions.findIndex(transaction => transaction._id.toString() === id);
    if (i != -1) return { replaceCrypto: crypto, i };
  }
  return {};
}