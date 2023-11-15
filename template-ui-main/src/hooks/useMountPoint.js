import { useState, useEffect } from 'react';

let mountPoints = null;

export const loadMountPoints = (name, reload) => {
  if (!mountPoints || reload) {
    return fetch(process.env.MOUNT_POINT_METADATA)
      .then(res => res.json())
      .then(res => {
        mountPoints = res;
        return mountPoints[name] || /* istanbul ignore next */ [];
      });
  }
  return mountPoints[name] || /* istanbul ignore next */ [];
};

export const filterMountPoints = (items, filters = []) =>
  items
    // deny
    .filter(each => {
      // console.log("each: ", each);
      const deny = each.deny || /* istanbul ignore next */ [];
      return deny.length === 0 ? true : filters.some(i => !deny.includes(i));
    })
    // allow
    .filter(each => {
      const allow = each.allow || /* istanbul ignore next */ [];
      return allow.length === 0 ? true : filters.some(i => allow.includes(i));
    })
    // env
    .filter(each => {
      const env = each.env || /* istanbul ignore next */ [];
      return env.length === 0 ? true : env.includes(process.env.ENV || '');
    })
    .sort((a, b) => a.order - b.order);
// .map(i => { console.log(i); return i; });

export default (name, reload) => {
  const [items, setItems] = useState(
    mountPoints ? mountPoints[name] || /* istanbul ignore next */ [] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountPoints || reload) {
      setLoading(true);
      setItems([]);
      mountPoints = null;
      fetch(process.env.MOUNT_POINT_METADATA)
        .then(res => res.json())
        .then(res => {
          mountPoints = res;
          setLoading(false);
          setItems(mountPoints[name] || /* istanbul ignore next */ []);
        })
        .catch(err => {
          setLoading(false);
          setError(err);
        });
    }
  }, [reload]);

  return { items, loading, error };
};
