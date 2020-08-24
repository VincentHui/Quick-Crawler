const axios = require("axios");
const cheerio = require("cheerio");

const relative = /^[^\/]+\/[^\/].*$|^\/[^\/].*$/gim;
const absoluteWithSedna = /^(?:https?:\/\/)?(?:[^\.]+\.)?sedna\.com(\/.*)?$/gim;

// use axios to fetch
const fetchData = async (url) => {
  return await axios(url).then((result) => result);
};

//define a curried pure function to get content
//scrape the html content to get links and then call the scrape function after links are collected
const GetLinks = (
  url,
  scrapeFn = (loaded, links) => {},
  domainUrl = "https://www.sedna.com"
) =>
  fetchData(url)
    .then((res) => {
      const html = res.data;
      const links = [];
      const $ = cheerio.load(html);

      $("a").each((i, elem) => {
        const url = elem.attribs.href;

        const isRelative = url.match(relative);
        const isAbsolute = url.match(absoluteWithSedna);
        if (isRelative || isAbsolute) {
          links.push(isRelative ? domainUrl + url : url);
        }
      });

      scrapeFn($, links);
      return links;
    })
    .catch((e) => []);

//this function recusviely crawls/calls to populate the page contents object with links and imgs
const PageContents = {};
const recursiveCrawl = async (url, crawled) => {
  if (crawled.find((u) => u === url)) return;
  crawled.push(url);
  console.log(url);
  const links = await GetLinks(url, (html, pageLinks) => {
    const imgs = [];
    //we can extend this scrapeFn callback further to include more content
    html("img").each((i, elem) => {
      const imgSource = elem.attribs.src;
      imgSource && imgs.push(imgSource);
    });
    PageContents[url] = { pageLinks, imgs };
  });

  var nexLinksToCrawl = links.filter((obj) => crawled.indexOf(obj) == -1);
  await Promise.all(
    nexLinksToCrawl.map((link) => recursiveCrawl(link, crawled))
  );
};

recursiveCrawl("https://www.sedna.com", []).then((r) =>
  console.log(PageContents)
);
