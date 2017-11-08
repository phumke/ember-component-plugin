'use strict';

import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import { Component } from './vweb-component';

export function getRelativeFilepath(root: string, filePath: string): string {
  const relPath = filePath.replace(root, '');

  if (relPath.length > 0 && relPath[0] === '/') {
    return relPath.slice(1);
  }

  return relPath;
}

// TODO refactor with looping
export class FileTaxonomy {
  constructor(private workspaceRoot: string) {
  }

  // Handle identifying non-component files and rejecting them
  filterNonComponents(files: File[]) {
    return files.filter(_ => _.isComponent() && !_.isTest() && !_.isScss());
  }

  getFullPath(relativeFilePath: string): string {
    return path.join(this.workspaceRoot, relativeFilePath);
  }

  /**
   * file structure:
   *  trunk/<core or extended>/lib/<engine or engine-ext>/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   *  trunk/engine-lib/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   *  trunk/global/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   * @param component
   */
  getComponentFiles(component: Component): File[] {
    const files = [];
    const templateFile = this.getTemplateFile(component);
    const jsFile = this.getJsFile(component);
    const testFiles = this.getTestFiles(component);
    const scssFiles = this.getScssFiles(component);
    if (templateFile) {
      files.push(templateFile);
    }
    if (jsFile) {
      files.push(jsFile);
    }
    if (testFiles) {
      files.push.apply(files, testFiles);
    }
    if (scssFiles) {
      files.push.apply(files, scssFiles);
    }

    return files;
  }

  getTemplateFile(component: Component): File {
    const name = component.name;
    const platform = component.platform;
    const engine = component.engine;
    const rootEngine = component.file.rootEngine();
    const remainder = component.pathRemainder;
    const ext = '.hbs';
    const filename = name + ext;

    const filePath = path.join(platform, 'lib', engine, 'addon', 'templates', 'components', remainder, filename);
    const enginesFilePath = path.join(platform, 'engines', engine, 'addon', 'templates', 'components', remainder, filename);
    const composureFilePath = path.join(platform, 'lib', rootEngine, 'addon', 'templates', 'components', remainder, filename);
    const composureEnginesFilePath = path.join(platform, 'engines', rootEngine, 'addon', 'templates', 'components', remainder, filename);
    const engineLibFilePath = path.join('engine-lib', engine, 'addon', 'templates', 'components', remainder, filename);
    const libFilePath = path.join('lib', engine, 'addon', 'templates', 'components', remainder, filename);

    if (this.fileExists(filePath)) {
        return new File(filePath);
    } else if (this.fileExists(enginesFilePath)) {
        return new File(enginesFilePath);
    } else if (this.fileExists(composureFilePath)) {
        return new File(composureFilePath);
    } else if (this.fileExists(composureEnginesFilePath)) {
        return new File(composureEnginesFilePath);
    } else if (this.fileExists(engineLibFilePath)) {
        return new File(engineLibFilePath);
    } else if (this.fileExists(libFilePath)) {
        return new File(libFilePath);
    }

    return null;
  }

  getJsFile(component: Component): File {
      const name = component.name;
      const platform = component.platform;
      const engine = component.engine;
      const rootEngine = component.file.rootEngine();
      const remainder = component.pathRemainder;
      const ext = '.js';
      const filename = name + ext;

      const filePath = path.join(platform, 'lib', engine, 'addon', 'components', remainder, filename);
      const enginesFilePath = path.join(platform, 'engines', engine, 'addon', 'components', remainder, filename);
      const composureFilePath = path.join(platform, 'lib', rootEngine, 'addon', 'components', remainder, filename);
      const composureEnginesFilePath = path.join(platform, 'engines', rootEngine, 'addon', 'components', remainder, filename);
      const engineLibFilePath = path.join('engine-lib', engine, 'addon', 'components', remainder, filename);
      const libFilePath = path.join('lib', engine, 'addon', 'components', remainder, filename);

      if (this.fileExists(filePath)) {
          return new File(filePath);
      } else if (this.fileExists(enginesFilePath)) {
          return new File(enginesFilePath);
      } else if (this.fileExists(composureFilePath)) {
          return new File(composureFilePath);
      } else if (this.fileExists(composureEnginesFilePath)) {
          return new File(composureEnginesFilePath);
      } else if (this.fileExists(engineLibFilePath)) {
          return new File(engineLibFilePath);
      } else if (this.fileExists(libFilePath)) {
          return new File(libFilePath);
      }

      return null;
  }

  /**
   * file structure
   *  trunk/extended/tests/unit/components/<engine>/<remainder of path>/<name>-test.js
   *  trunk/core/lib/voyager-testing/tests/<unit or integration>/components/<engine without ext>/<remainder of path>/<name><N/A or -core or -ext>-test.js
   *  trunk/core/lib/voyager-testing/tests/acceptance/<engine without ext>/<remainder of path>/<name><N/A or -core or -ext>-test.js
   * @param originalComponentFile
   */
    getTestFiles(component: Component): File[] {
      const name = component.name;
      const platform = component.platform;
      const platformExt = (platform === 'core' ? 'core' : 'ext');
      const rootEngine = component.file.rootEngine();
      const platformEngine = rootEngine + '-' + platformExt;
      const remainder = component.pathRemainder;
      const globalFilename = name + '-test.js';
      const platformFilename = name + '-' + platformExt + '-test.js';

      const testFiles = [];
      const globalUnitPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'unit', 'components', rootEngine, remainder, globalFilename)
      const platformUnitPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'unit', 'components', rootEngine, remainder, platformFilename)

      const globalIntPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'integration', 'components', rootEngine, remainder, globalFilename)
      const platformIntPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'integration', 'components', rootEngine, remainder, platformFilename)

      console.log("core/lib/voyager-testing/tests/integration/components/onboarding/onboarding-combo-bar-ext-test.js");
      console.log(platformIntPath);

      const globalAcceptPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'acceptance', rootEngine, remainder, globalFilename)
      const platformAcceptPath = path.join('core', 'lib', 'voyager-testing', 'tests', 'acceptance', rootEngine, remainder, platformFilename)

      const extendedUnitPath = path.join('extended', 'tests', 'unit', 'components', rootEngine, remainder, globalFilename);
      const extendedUnitPath2 = path.join('extended', 'tests', 'unit', 'components', platformEngine, remainder, globalFilename);
      const extendedIntPath = path.join('extended', 'tests', 'integration', 'components', rootEngine, remainder, globalFilename);
      const extendedIntPath2 = path.join('extended', 'tests', 'integration', 'components', platformEngine, remainder, globalFilename);
      const extendedAcceptPath = path.join('extended', 'tests', 'acceptance', 'components', rootEngine, remainder, globalFilename);
      const extendedAcceptPath2 = path.join('extended', 'tests', 'acceptance', 'components', platformEngine, remainder, globalFilename);



      if (this.fileExists(globalUnitPath)) {
          testFiles.push(new File(globalUnitPath));
      }
      if (this.fileExists(platformUnitPath)) {
          testFiles.push(new File(platformUnitPath));
      }
      if (this.fileExists(extendedUnitPath)) {
          testFiles.push(new File(extendedUnitPath));
      }
      if (this.fileExists(extendedUnitPath2)) {
          testFiles.push(new File(extendedUnitPath2));
      }
      if (this.fileExists(globalIntPath)) {
          testFiles.push(new File(globalIntPath));
      }
      if (this.fileExists(platformIntPath)) {
          testFiles.push(new File(platformIntPath));
      }
      if (this.fileExists(extendedIntPath)) {
          testFiles.push(new File(extendedIntPath));
      }
      if (this.fileExists(extendedIntPath2)) {
          testFiles.push(new File(extendedIntPath2));
      }
      if (this.fileExists(globalAcceptPath)) {
          testFiles.push(new File(globalAcceptPath));
      }
      if (this.fileExists(platformAcceptPath)) {
          testFiles.push(new File(platformAcceptPath));
      }
      if (this.fileExists(extendedAcceptPath)) {
          testFiles.push(new File(extendedAcceptPath));
      }
      if (this.fileExists(extendedAcceptPath2)) {
          testFiles.push(new File(extendedAcceptPath2));
      }

      return testFiles;
  }

  // TODO need to add a lookup for global files too
  // TODO handle special case of shared directory
  getScssFiles(component: Component): File[] {
    const name = component.name + '.scss';
    const platform = component.platform;
    const platformExt = (platform === 'core' ? 'core' : 'ext');
    const engine = component.engine;
    const remainder = component.pathRemainder;

    const scssFiles = [];
    const platformAddonPath = path.join(platform, 'lib', engine, 'addon', 'styles', 'components', remainder);
    const platformAppPath = path.join(platform, 'lib', engine, 'app', 'styles', 'components', remainder);

    const platformAddonRootPath = path.join(platform, 'lib', engine, 'addon', 'styles', 'components');
    const platformAppRootPath = path.join(platform, 'lib', engine, 'app', 'styles', 'components');

    if (this.fileExists(platformAddonPath)) {
        scssFiles.push.apply(scssFiles, this.getSimilarFiles(platformAddonPath, name));
    }
    if (this.fileExists(platformAppPath)) {
        scssFiles.push.apply(scssFiles, this.getSimilarFiles(platformAppPath, name));
    }
    if (this.fileExists(platformAddonRootPath)) {
        scssFiles.push.apply(scssFiles, this.getSimilarFiles(platformAddonRootPath, name));
    }
    if (this.fileExists(platformAppRootPath)) {
        scssFiles.push.apply(scssFiles, this.getSimilarFiles(platformAppRootPath, name));
    }

    return scssFiles;
}

    getSimilarFiles(relativeFilePath: string, desiredName: string): File[] {
        const matchedFiles = [];
        fs.readdirSync(path.join(this.workspaceRoot, relativeFilePath)).forEach(file => {
            if (file.endsWith(desiredName)) {
                matchedFiles.push(new File(path.join(relativeFilePath, file)));
            }
        });

        return matchedFiles;
    }

    fileExists(relativeFilePath: string): boolean {
        return fs.existsSync(path.join(this.workspaceRoot, relativeFilePath))
    }
}
