import  * as nc from  "./node_modules/squint-cljs/node-api.js";
import {ceramic, authenticate, write_composite} from "./dev.mjs";
import path, { dirname } from "path";
import fs from "fs";

export default function viteSquint(opts = {}) {
  const squint = {
    name: "squint_compile",
    enforce: "pre",
    async load(id) {
      console.log("loading", id);

      // the resolveId adds the .jsx extension
      if (/\.cljs.jsx$/.test(id)) {
        // for cljs files, we just need to load and compile
        // TODO: macros
        // TODO: squint source mapping

        const file = id.replace(/.jsx$/, "");
        const code = await fs.promises.readFile(file, "utf-8");

        const compiled_nc = await nc.compileString(code);

        // console.log(compiled);
        // console.log("----------------------------");
        // console.log(compiled_nc);

        return { code: compiled_nc.imports + compiled_nc.body + compiled_nc.exports, map: null };
      }
    },
    resolveId(id, importer, options) {
    //console.log(checkFileEnding(id));
      if (/\.cljs.jsx$/.test(id)) {
        // Vite can prompt the plugin to resolve modules that it has already
        // resolved. As we have already resolved the module and added the
        // extension to the id we just need to return the absolute resolveId again.

        return path.resolve(dirname(importer), id);
      }
      if (/\.cljs$/.test(id)) {
        // For cljs files we need to do the following:
        // absolutize the path, this makes it easier for load and other plugins
        // append .jsx so that other plugins can pick it up
        const absolutePath = path.resolve(dirname(importer), id);
        //console.log("id", id);

        if (options.scan) {
          // Vite supports the concept of virtual modules, which are not direct
          // files on disk but dynamically generated contents that Vite and its
          // plugins can work with. We return a virtual module identifier
          // (prefixed with \0 to denote its virtual nature), we effectively
          // communicate to Vite and other plugins in the ecosystem that the
          // module is managed by the plugin and should be treated differently
          // from regular file-based modules. As `.cljs.jsx` files are not real.
          // https://vitejs.dev/guide/api-plugin#virtual-modules-convention
          return "\0" + absolutePath + ".jsx";
        }
        return absolutePath + ".jsx";
      }
    },
    handleHotUpdate({file, server, modules }) {
      console.log("test ", file);
      console.log("modules", modules);

      if (/\.graphql$/.test(file)) {
        console.log("graphql file changed");
        write_composite(ceramic).then((res) => {
              console.log(res);
                }).catch((error) => {
                    console.error(error);
                      });
      }

      if (/\.cljs$/.test(file)) {
        // this needs to be the same id returned by resolveId this is what
        // vite uses as the modules identifier

        // for (let ending in [".jsx" ".mjs"]) {

        // }
            const resolveId = file + ".jsx";
        // console.log("resolveId ", resolveId);

            const module = server.moduleGraph.getModuleById(resolveId);
        if (module) {
          // invalidate dependants
          server.moduleGraph.onFileChange(resolveId);
          // hot reload
          console.log( "r ", [...modules, module ]);
          return [...modules, module ]
        }
        return modules;
      }
    },
  };
  return [squint];
}
