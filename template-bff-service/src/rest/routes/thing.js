export const queryThings = (req, res) => req.namespace.models.thing
  .query({ ...req.params, ...req.query })
  .then((response) => res.status(200)
    .json(response));

export const getThing = (req, res) => req.namespace.models.thing
  .get(req.params.id)
  .then((data) => res.status(200).json(data));

export const saveThing = (req, res) => req.namespace.models.thing
  .save(req.params.id, req.body)
  .then(() => res.status(200).json({}));

export const deleteThing = (req, res) => req.namespace.models.thing
  .delete(req.params.id)
  .then(() => res.status(200).json({}));
