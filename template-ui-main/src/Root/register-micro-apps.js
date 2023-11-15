/* eslint-disable no-console */
import { registerApplication, start } from 'single-spa';
import {
  constructApplications,
  constructRoutes,
  constructLayoutEngine,
} from 'single-spa-layout';
import PubSub from 'pubsub-js';
import { toast } from 'react-toastify';

import { loadMountPoints, filterMountPoints } from '../hooks/useMountPoint';

const THEME_KEY = 'themekey';
const THEME_KEY_DEFAULT = 'theme';

export default (isAuthorizedFn, queryClient) => {
  console.log('Indexing Micro App Registry resource @ apps.json');
  const publish = (event, data) => PubSub.publish(event, data);
  const subscribe = (event, callback) => PubSub.subscribe(event, callback);
  const unsubscribe = token => PubSub.unsubscribe(token);

  const themeProjectName = localStorage.getItem(THEME_KEY) || THEME_KEY_DEFAULT;

  return Promise.all([
    loadMountPoints('main'),
    fetch(process.env.MICRO_APP_METADATA).then(res => {
      if (!res.ok) {
        const error = new Error(
          `Failed to fetch registry resource (STATUS: ${res.status}`
        );
        console.error(error);
        throw error;
      }
      return res.json();
    }),
  ]).then(([items, layout]) => {
    // First check env props to see if it has a list of enabled env.
    // If it is not specified or empty, we assume enabled for all.
    const authorizedRoutes = layout.routes
      // deny theme
      .filter(route => {
        // console.log("each: ", route);
        const deny = route.props?.deny || [];
        return deny.length === 0 ? true : !deny.includes(themeProjectName);
      })
      // allow theme
      .filter(route => {
        const allow = route.props?.allow || [];
        return allow.length === 0 ? true : allow.includes(themeProjectName);
      })
      // env
      .filter(route => {
        const env = route.props?.env || [];
        return env.length === 0 ? true : env.includes(process.env.ENV);
      })
      // permissions
      .filter(route => {
        const roles = route.props?.roles || [];
        const userExpression = route.props?.rolesUserCustomExpression;
        if (route.props?.authorizedForAllRoles) {
          return true;
        }
        return isAuthorizedFn(roles, userExpression);
      });

    const authorizedLayout = { routes: authorizedRoutes };
    const routes = constructRoutes(authorizedLayout);
    const applications = constructApplications({
      routes,
      loadApp: ({ name }) => System.import(name),
    });
    const layoutEngine = constructLayoutEngine({ routes, applications });

    applications.map(mfe =>
      registerApplication({
        ...mfe,
        customProps: (name, location) => ({
          ...mfe.customProps(name, location),
          publish,
          subscribe,
          unsubscribe,
          toast,
          queryClient,
        }),
      })
    );

    document.body.classList.toggle(themeProjectName, true);

    // main mount point
    // start after we load these foundational apps
    return Promise.all([
      ...filterMountPoints(items, [themeProjectName]).map(i =>
        System.import(i.import)
      ),
    ]).then(() => {
      layoutEngine.activate();
      start();
    });
  });
};
