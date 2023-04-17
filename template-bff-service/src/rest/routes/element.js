export const saveElement = (req, res) => req.namespace.models.element
  .save(req.params, req.body)
  .then(() => res.status(200).json({}));

export const deleteElement = (req, res) => req.namespace.models.element
  .delete(req.params)
  .then(() => res.status(200).json({}));
