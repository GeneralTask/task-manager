package external

import (
	"fmt"
	"net/http"
	"strings"
)

const (
	stale = iota
	fresh
	// XFromCache is the header added to responses that are returned from the cache
	XFromCache = "X-From-Cache"
)

type Transport struct {
	Transport http.RoundTripper
	// If true caches will be marked with an extra "X-From-Cache" header
	MarkCachedResponses bool
}

func (t *Transport) Client() *http.Client {
	return &http.Client{ Transport: t }
}


// cloneRequest returns a clone of the provided *http.Request.
// The clone is a shallow copy of the struct and its Header map.
// (This function copyright goauth2 authors: https://code.google.com/p/goauth2)
func cloneRequest(r *http.Request) *http.Request {
	// shallow copy of the struct
	r2 := new(http.Request)
	*r2 = *r
	// deep copy of the Header
	r2.Header = make(http.Header)
	for k, s := range r.Header {
		r2.Header[k] = s
	}
	return r2
}

func getEndToEndHeaders(respHeaders http.Header) []string {
	// These headers are always hop-by-hop
	hopByHopHeaders := map[string]struct{}{
		"Connection":          {},
		"Keep-Alive":          {},
		"Proxy-Authenticate":  {},
		"Proxy-Authorization": {},
		"Te":                  {},
		"Trailers":            {},
		"Transfer-Encoding":   {},
		"Upgrade":             {},
	}

	for _, extra := range strings.Split(respHeaders.Get("connection"), ",") {
		// any header listed in connection, if present, is also considered hop-by-hop
		if strings.Trim(extra, " ") != "" {
			hopByHopHeaders[http.CanonicalHeaderKey(extra)] = struct{}{}
		}
	}
	endToEndHeaders := []string{}
	for respHeader := range respHeaders {
		if _, ok := hopByHopHeaders[respHeader]; !ok {
			endToEndHeaders = append(endToEndHeaders, respHeader)
		}
	}
	return endToEndHeaders
}

// Roundtrip is middleware that we're using to cache responses from the external API
func (t *Transport) RoundTrip(req *http.Request) (resp *http.Response, err error) {
	cacheable := req.Method == "GET"
	var cachedResponse *http.Response
	if cacheable {
		cachedResponse, err := GetCacheResponse(req)

	}
	transport := t.Transport
	if transport == nil {
		transport = http.DefaultTransport
	} 


	if cacheable && cachedResponse != nil && err != nil {
		if t.MarkCachedResponses {
			cachedResponse.Header.Add(XFromCache, "1")
		}
		var req2 *http.Request
		// Add validators if caller hasn't already done so
		etag := cachedResponse.Header.Get("etag")
		if etag != "" && req.Header.Get("etag") == "" {
			req2 = cloneRequest(req)
			req2.Header.Set("if-none-match", etag)
		}
		lastModified := cachedResponse.Header.Get("last-modified")
		if lastModified != "" && req.Header.Get("last-modified") == "" {
			if req2 == nil {
				req2 = cloneRequest(req)
			}
			req2.Header.Set("if-modified-since", lastModified)
		}
		if req2 != nil {
			req = req2 
		}
		return cachedResponse, nil
	}

	resp, err = transport.RoundTrip(req)
	// Replace the 304 response with a cached response from the DB
	if err == nil && req.Method == "GET" && resp.StatusCode == http.StatusNotModified {
		// Replace the 304 response with the one from the cache, but update with new headers
		endToEndHeaders := getEndToEndHeaders(resp.Header)
		for _, header := range endToEndHeaders {
			cachedResponse.Header[header] = resp.Header[header]
		}
		resp = cachedResponse
	} 
	// TODO: store response in cache if it's cacheable

	if err != nil {
		return nil, err
	}
	return resp, nil
}

func NewTransport() *Transport {
	return &Transport{
		Transport: nil,
		MarkCachedResponses: false,
	}
}


func GetCacheResponse(request *http.Request) (resp *http.Response, err error) {
	// TODO: Get cached response from the database. I was thinking of storing the response as a field in either the PR or Repo structs.
	return nil, nil
}
