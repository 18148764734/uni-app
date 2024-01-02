import {
  parseUniExtApiNamespacesOnce,
  resolveUTSCompiler,
  uniUTSUVueJavaScriptPlugin,
  uniUTSUniModulesPlugin,
} from '@dcloudio/uni-cli-shared'

import { uniAppIOSPlugin } from './plugin'
import { uniAppIOSMainPlugin } from './mainUTS'
import { uniPrePlugin } from '../pre'
import { uniAppManifestPlugin } from './manifestJson'
import { uniAppPagesPlugin } from './pagesJson'

export function init() {
  return [
    uniPrePlugin(),
    uniUTSUniModulesPlugin({
      x: true,
      isSingleThread: process.env.UNI_APP_X_SINGLE_THREAD !== 'false',
      extApis: parseUniExtApiNamespacesOnce(
        process.env.UNI_UTS_PLATFORM,
        process.env.UNI_UTS_TARGET_LANGUAGE
      ),
    }),
    uniAppIOSPlugin(),
    uniAppIOSMainPlugin(),
    uniAppManifestPlugin(),
    uniAppPagesPlugin(),
    uniUTSUVueJavaScriptPlugin(),
    resolveUTSCompiler().uts2js({
      inputDir: process.env.UNI_INPUT_DIR,
      version: process.env.UNI_COMPILER_VERSION,
    }),
  ]
}
