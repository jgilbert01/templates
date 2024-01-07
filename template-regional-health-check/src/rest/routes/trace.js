export const check = (req, res) =>
  req.namespace.models.trace
    .check()
    .then(data =>
      res
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .status(data.statusCode)
        .json(data),
    );
