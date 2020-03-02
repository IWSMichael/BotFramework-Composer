// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import merge from 'lodash/merge';

import { pluginLoader, PluginLoader } from '../services/pluginLoader';
import { BotProjectService } from '../services/project';
const defaultPublishConfig = {
  name: 'default',
  type: 'localpublish',
};
export const PublishController = {
  getTypes: async (req, res) => {
    res.json(Object.keys(pluginLoader.extensions.publish));
  },
  publish: async (req, res) => {
    const target = req.params.target;
    const user = await PluginLoader.getUserFromRequest(req);
    const sensitiveSetting = req.body;
    const projectId = req.params.projectId;
    const currentProject = await BotProjectService.getProjectById(projectId, user);

    // find publish config by name.
    const configs = currentProject.settings?.publishTargets?.filter(t => t.name === target) || [defaultPublishConfig];
    const config = configs.length ? configs[0] : undefined;
    const method = config ? config.type : undefined;

    // append config from client(like sensitive settings)
    config.configuration = {
      ...config.configuration,
      settings: merge({}, currentProject.settings, sensitiveSetting),
    };

    if (config && pluginLoader.extensions.publish[method] && pluginLoader.extensions.publish[method].publish) {
      // get the externally defined method
      const pluginMethod = pluginLoader.extensions.publish[method].publish;

      // call the method
      const results = await pluginMethod.call(null, config.configuration, currentProject, user);
      res.json({
        target: target,
        results: results,
      });
    } else {
      res.json({
        statusCode: '400',
        message: `${method} is not a valid publishing target type. There may be a missing plugin.`,
      });
    }
  },
  status: async (req, res) => {
    const method = req.params.method;
    if (pluginLoader.extensions.publish[method] && pluginLoader.extensions.publish[method].getStatus) {
      // get the externally defined method
      const pluginMethod = pluginLoader.extensions.publish[method].getStatus;

      const target = req.body.target;

      // call the method
      const results = await pluginMethod.call(null, target, {});
      res.json({
        target: target.name,
        results: results,
      });
    } else {
      res.json({
        statusCode: '400',
        message: `${method} is not a valid publishing target type. There may be a missing plugin.`,
      });
    }
  },
  history: async (req, res) => {
    // TODO
  },
  rollback: async (req, res) => {
    // TODO
  },
};
