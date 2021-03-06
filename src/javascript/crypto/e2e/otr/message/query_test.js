/**
 * @license
 * Copyright 2014 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Tests for the OTR Query message.
 *
 * @author rcc@google.com (Ryan Chan)
 */

goog.require('e2e.otr.constants');
goog.require('e2e.otr.error.ParseError');
goog.require('e2e.otr.message.Query');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');

goog.setTestOnly();


var query = e2e.otr.message.Query;
var constants = e2e.otr.constants;
var versions = constants.Version;


function testFromVersion() {
  assertEquals(new query(null, versions.V1).toString(), '?OTR?');
  assertEquals(new query(null, versions.V2).toString(), '?OTRv2?');
  assertEquals(new query(null, versions.V3).toString(), '?OTRv3?');
  assertEquals(new query(null, versions.V1 | versions.V2).toString(),
      '?OTR?v2?');
  assertEquals(new query(null, versions.V1 | versions.V3).toString(),
      '?OTR?v3?');
  assertEquals(new query(null, versions.V2 | versions.V3).toString(),
      '?OTRv23?');
  assertEquals(
      new query(null, versions.V1 | versions.V2 | versions.V3).toString(),
      '?OTR?v23?');
}

function testParse() {
  assertEquals(query.parse('?OTR?'), versions.V1);
  assertEquals(query.parse('?OTRv2?'), versions.V2);
  assertEquals(query.parse('?OTRv23?'), versions.V2 | versions.V3);
  assertEquals(query.parse('?OTR?v2?'), versions.V1 | versions.V2);
  assertEquals(query.parse('?OTRv24x?'), versions.V2);
  assertEquals(query.parse('?OTR?v24x?'), versions.V1 | versions.V2);
  assertEquals(query.parse('?OTR?v?'), versions.V1);
  assertEquals(query.parse('?OTRv?'), 0);

  // Invalid Query Message: ?OTR not found
  var err = assertThrows(goog.partial(query.parse, 'junk'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // Extra data after version string
  err = assertThrows(goog.partial(query.parse, '?OTR?junk'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // Extra data after version string
  err = assertThrows(goog.partial(query.parse, '?OTR?v2?junk'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // Version already listed
  err = assertThrows(goog.partial(query.parse, '?OTR?v232?junk'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // Version already listed
  err = assertThrows(goog.partial(query.parse, '?OTRv33?junk'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // OTR version not "?" terminated
  err = assertThrows(goog.partial(query.parse, '?OTRv3'));
  assertTrue(err instanceof e2e.otr.error.ParseError);

  // OTR version not "?" terminated
  err = assertThrows(goog.partial(query.parse, '?OTR?v23'));
  assertTrue(err instanceof e2e.otr.error.ParseError);
}

function testParseEmbedded() {
  assertEquals(query.parseEmbedded('junk?OTR?v23xxxxxxx'), versions.V1);
  assertEquals(query.parseEmbedded('junk?OTRv23xxxxxxx'), 0);
  assertEquals(query.parseEmbedded('junk?OTRv23?junk'),
      versions.V2 | versions.V3);
  assertEquals(query.parseEmbedded('?OTR?'), versions.V1);
  assertEquals(query.parseEmbedded('junk?OTRv2?'), versions.V2);
  assertEquals(query.parseEmbedded('?OTRv23?junk'), versions.V2 | versions.V3);
  assertEquals(query.parseEmbedded('?OTRv23??OTRv?'), 0);
  assertEquals(query.parseEmbedded('junk?OTRv23?junk?OTR?v24x?junk'),
      versions.V1 | versions.V2);
  assertEquals(query.parseEmbedded('?OTRv2?junk?OTR?v33junk'), versions.V1);
  assertEquals(query.parseEmbedded('?OTRv2?junk?OTRv33junk'), versions.V2);
  assertEquals(query.parseEmbedded('?OTRv3junk?'), versions.V3);
  assertEquals(query.parseEmbedded('?OTRv33??OTR?v22?'), 0);
}
