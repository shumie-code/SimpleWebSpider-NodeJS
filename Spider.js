import fs from "fs";
import path from "path";
import superagent from "superagent";
import mkdirp from "mkdirp";
import { urlToFilename } from "./utils.js";

/**
 * spider() function, which takes in the URL to download and a
 * callback function that will be invoked when the download
 * process is complete.
 */

export function spider(url, cb) {
  const filename = urlToFilename(url);
  /**
   * This code checks whether the URL was already downloaded by verifying
   * that the corresponding file was not already created. If err
   * is defined and has type ENOENT, then the file does not exist
   * and it's safe to create it.
   */
  fs.access(filename, (err) => {
    if (err && err.code === "ENOENT") {
      console.log(`Downloading ${url} into ${filename}`);
      // If the file is not found, the URL is downloaded using the following line of code:
      superagent.get(url).end((err, res) => {
        if (err) {
          cb(err);
        } else {
          // We ensure the directory that will contain the file exists:
          mkdirp(path.dirname(filename), (err) => {
            if (err) {
              cb(err);
            } else {
              // Finally, we write the body of the HTTP response to the filesystem:
              fs.writeFile(filename, res.text, (err) => {
                if (err) {
                  cb(err);
                } else {
                  cb(null, filename, true);
                }
              });
            }
          });
        }
      });
    } else {
      cb(null, filename, false);
    }
  });
}
