var auth = require('../auth.js');

describe('hmac-md5', function () {
  it('should works correctly', function () {
    var hash = auth.hmacMd5('nonce', 'B37Ab888CAB4343434bAE98AAAAAABC1');
    expect(hash).toBe('B510MG+AsMpvUDlm7oFsRg==');
  });
});

