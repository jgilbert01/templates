export const subscribe = (req, res) => req.namespace.models.subscription
  .subscribe(req.body)
  .then((data) => res.status(200).json(data));

export const unsubscribe = (req, res) => req.namespace.models.subscription
  .unsubscribe(req.body)
  .then((data) => res.status(200).json(data));

export const longPoll = (req, res) => req.namespace.models.subscription
  .longPoll(req.body)
  .then((data) => res.status(200).json(data));
