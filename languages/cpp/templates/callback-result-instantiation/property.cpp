${shape}            ${if.non.const}${if.non.anyOf}${if.non.array}${if.non.object}${if.optional}if (proxyResponse->${Property}.IsSet()) {
                ${base.title}.${property} = proxyResponse->${Property};
            }${end.if.optional}${if.non.optional}${base.title}.${property} = proxyResponse->${Property};${end.if.non.optional}${end.if.non.object}${end.if.non.array}${end.if.non.anyOf}${end.if.non.const}