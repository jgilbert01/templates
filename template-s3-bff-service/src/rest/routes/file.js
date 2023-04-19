export const queryFiles = (req, res) => req.namespace.models.file
  .query({ ...req.params, ...req.query })
  .then((response) => res.status(200)
    .json(response));

export const getHistory = (req, res) => req.namespace.models.file
  .get({ ...req.params, ...req.query })
  .then((response) => res.status(200)
    .header('Cache-Control', 'private, max-age=300')
    .json(response));

export const getFileSignedUrl = (req, res) => req.namespace.models.file
  .getSignedUrl({ ...req.params, ...req.query })
  .then((signedUrl) => (req.query?.redirect === 'false'
    ? /* istanbul ignore next */ res.status(200).json({ signedUrl })
    : res.redirect(303, signedUrl)));

export const saveFile = (req, res) => req.namespace.models.file
  .save({
    ...req.params, headers: req.headers, body: req.rawBody, isBase64Encoded: req.isBase64Encoded,
  })
  .then((response) => res.status(200)
    .json(response));

export const deleteFile = (req, res) => req.namespace.models.file
  .delete(req.params)
  .then(() => res.status(200).json({}));
