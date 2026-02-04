import { useEffect } from "react";

/**
 * Hook to update the document title
 * @param title - The title to set for the page
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook to update meta tags in the document head
 * @param tags - Object containing meta tag updates
 */
export function useMetaTags(tags: { 
  description?: string; 
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: string;
}) {
  useEffect(() => {
    const metaElements: Array<{ element: HTMLMetaElement; originalContent: string }> = [];

    // Update or create description meta tag
    if (tags.description) {
      const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (descMeta) {
        const originalContent = descMeta.content;
        descMeta.content = tags.description;
        metaElements.push({ element: descMeta, originalContent });
      } else {
        const newMeta = document.createElement("meta");
        newMeta.name = "description";
        newMeta.content = tags.description;
        document.head.appendChild(newMeta);
      }
    }

    // Update or create keywords meta tag
    if (tags.keywords) {
      const keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (keywordsMeta) {
        const originalContent = keywordsMeta.content;
        keywordsMeta.content = tags.keywords;
        metaElements.push({ element: keywordsMeta, originalContent });
      } else {
        const newMeta = document.createElement("meta");
        newMeta.name = "keywords";
        newMeta.content = tags.keywords;
        document.head.appendChild(newMeta);
      }
    }

    // Update or create Open Graph title
    if (tags.ogTitle) {
      const ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (ogTitleMeta) {
        const originalContent = ogTitleMeta.content;
        ogTitleMeta.content = tags.ogTitle;
        metaElements.push({ element: ogTitleMeta, originalContent });
      } else {
        const newMeta = document.createElement("meta");
        newMeta.setAttribute("property", "og:title");
        newMeta.content = tags.ogTitle;
        document.head.appendChild(newMeta);
      }
    }

    // Update or create Open Graph description
    if (tags.ogDescription) {
      const ogDescMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (ogDescMeta) {
        const originalContent = ogDescMeta.content;
        ogDescMeta.content = tags.ogDescription;
        metaElements.push({ element: ogDescMeta, originalContent });
      } else {
        const newMeta = document.createElement("meta");
        newMeta.setAttribute("property", "og:description");
        newMeta.content = tags.ogDescription;
        document.head.appendChild(newMeta);
      }
    }

    // Update or create Twitter card
    if (tags.twitterCard) {
      const twitterMeta = document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement;
      if (twitterMeta) {
        const originalContent = twitterMeta.content;
        twitterMeta.content = tags.twitterCard;
        metaElements.push({ element: twitterMeta, originalContent });
      } else {
        const newMeta = document.createElement("meta");
        newMeta.name = "twitter:card";
        newMeta.content = tags.twitterCard;
        document.head.appendChild(newMeta);
      }
    }

    // Cleanup function to restore original values
    return () => {
      metaElements.forEach(({ element, originalContent }) => {
        element.content = originalContent;
      });
    };
  }, [tags.description, tags.keywords, tags.ogTitle, tags.ogDescription, tags.twitterCard]);
}
