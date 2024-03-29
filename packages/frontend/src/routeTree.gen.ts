/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as ProposalProposalIdImport } from './routes/proposal/$proposalId'

// Create Virtual Routes

const ProposalCreateLazyImport = createFileRoute('/proposal/create')()

// Create/Update Routes

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ProposalCreateLazyRoute = ProposalCreateLazyImport.update({
  path: '/proposal/create',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/proposal/create.lazy').then((d) => d.Route),
)

const ProposalProposalIdRoute = ProposalProposalIdImport.update({
  path: '/proposal/$proposalId',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/proposal/$proposalId.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/proposal/$proposalId': {
      preLoaderRoute: typeof ProposalProposalIdImport
      parentRoute: typeof rootRoute
    }
    '/proposal/create': {
      preLoaderRoute: typeof ProposalCreateLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ProposalProposalIdRoute,
  ProposalCreateLazyRoute,
])

/* prettier-ignore-end */
