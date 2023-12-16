import { publish } from './publish';

export default [
  {
    id: 'ingress',
    flavor: publish,
    eem: {
      fields: [
        'data',
        'beforeImage',
      ],
    },
  },
];
