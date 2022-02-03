import fs from 'fs';
import path from 'path';
import superagent from 'superagent';
import mkdirp from 'mkdirp';
import { urlToFilename } from './utils.js';

/**
 * spider() function, which takes in the URL to download and a
 * callback function that will be invoked when the download
 * process is complete.
 */

/**
 * The functionality that writes a given string to a file
 * can be easily factored out into a separate function as follows:
 */
function saveFile (filename, contents, cb) {
  mkdirp(path.dirname(filename), err => {
    if (err) {
      return cb(err)
    }
    fs.writeFile(filename, contents, cb)
  })
}
/**
 * Create a generic function named download() that takes a
 * URL and a filename as input, and downloads the URL into 
 * the given file. Internally, we can use the saveFile()
 * function we created earlier:
 */
function download (url, filename, cb) {
  console.log(`Downloading ${url}`)
  superagent.get(url).end((err, res) => {
    if (err) {
      return cb(err)
    }
    saveFile(filename, res.text, err => {
      if(err) {
        return cb(err)
      }
      console.log(`Downloaded and saved: ${url}`)
      cb(null, res.text)
    })
  })
}

/**
 * Create the core of this new version of our web spider
 * application, the spiderLinks() function, which downloads all
 * the links of an HTML page using a sequential asynchronous iteration 
 * algorithm. 
 */
function spiderLinks (currentUrl, body, nesting, cb) {
  if (nesting === 0) {
    // Remember Zalgo
    return process.nextTick(cb)
  }
  /**
   * Obtain list of all links contained in the page using 
   * the getPageLinks() function. This function returns only
   * the links pointing to an internal destination (the same hostname).
   */
  const links = getPageLinks(currentUrl, body)
  if (links.length === 0) {
    return process.nextTick(cb)
  }
  /**
   * We iterate over the links using a local function called iterate(),
   * which takes the index of the next link to analyze. In this function, 
   * the first thing we do is check whether the index is equal to the
   * length of the links array, in which we immediately invoke the cb()
   * function, as it means we have processed all the items.
   */
  function iterate (index) {
    if (index === links.length) {
      return cb()
    }
    spider(links[index], nesting - 1, function (err) {
      if (err) {
        return cb(err)
      } 
      iterate(index + 1)
    })
  }
  // The last step in spiderLinks(), we bootstrap the iteration by invoking iterate(0)
  iterate(0)
}

// For the last step,modify the spider() function
export function spider (url, nesting, cb) {
  const filename = urlToFilename(url)
  fs.readFile(filename, 'utf8', (err, fileContent) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        return cb(err)
      }
    // If the file doesn't exist, download it
    return download(url, filename, (err, requestContent) => { 
     if (err) {
       return cb(err)
     }
     spiderLinks(url, requestContent, nesting, cb)
    })
  }
  // The file already exists, lets process the links
  spiderLinks(url, fileContent, nesting, cb)
})
}