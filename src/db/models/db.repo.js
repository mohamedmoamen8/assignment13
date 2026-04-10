export const findById = async ({
  model,
  id,
  select = " ",
  options = {},
}) => {
  
  const query = model.findOne({ _id: id }).select(select);

  if (options.populate) {
    query.populate(options.populate);
  }

  if (options.lean) {
    query.lean();
  }

  const doc = await query;
  return doc;
};

export const create = async ({ model, data }) => {
  return model.create(data);
};

export const findOne = async ({ model, filter, select = " ", options = {} }) => {
  const query = model.findOne(filter).select(select);

  if (options.populate) {
    query.populate(options.populate);
  } 
   if (options.lean) {
    query.lean();
  }

  const doc = await query;
  return doc;
};

export const find = async ({ model, filter, select = " ", options = {} }) => {
  const query = model.find(filter).select(select);

  if (options.populate) {
    query.populate(options.populate);
  }
   if (options.lean) {
    query.lean();
  }

  const docs = await query;
  return docs;
};
