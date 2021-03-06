// PLUGINS IMPORTS //
const { SchemaDirectiveVisitor, AuthenticationError } = require("apollo-server")
const { defaultFieldResolver, GraphQLString } = require("graphql")

// COMPONENTS IMPORTS //
const { formatDate } = require("../../utils/functions")

/////////////////////////////////////////////////////////////////////////////

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver
    field.resolve = async (root, args, ctx, info) => {
      if (!ctx.user) {
        throw new AuthenticationError("Not authorized")
      }

      return resolver(root, args, ctx, info)
    }
  }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver
    const { role } = this.args

    field.resolve = async (root, args, ctx, info) => {
      if (ctx.user.role !== role) {
        throw new AuthenticationError("Role is invalid")
      }

      return resolver(root, args, ctx, info)
    }
  }
}

class FormatDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver
    const { format: defaultFormat } = this.args

    field.args.push({
      name: "format",
      type: GraphQLString,
    })

    field.resolve = async (root, { format, ...rest }, ctx, info) => {
      const result = await resolver.call(this, root, rest, ctx, info)

      return formatDate(result, format || defaultFormat)
    }

    field.type = GraphQLString
  }
}

module.exports = {
  AuthenticationDirective,
  AuthorizationDirective,
  FormatDateDirective,
}
