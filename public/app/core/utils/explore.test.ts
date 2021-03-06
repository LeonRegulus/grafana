import {
  DEFAULT_RANGE,
  serializeStateToUrlParam,
  parseUrlState,
  updateHistory,
  clearHistory,
  hasNonEmptyQuery,
} from './explore';
import { ExploreState } from 'app/types/explore';
import store from 'app/core/store';

const DEFAULT_EXPLORE_STATE: ExploreState = {
  datasource: null,
  datasourceError: null,
  datasourceLoading: null,
  datasourceMissing: false,
  datasourceName: '',
  exploreDatasources: [],
  graphRange: DEFAULT_RANGE,
  history: [],
  initialQueries: [],
  queryTransactions: [],
  range: DEFAULT_RANGE,
  showingGraph: true,
  showingLogs: true,
  showingTable: true,
  supportsGraph: null,
  supportsLogs: null,
  supportsTable: null,
};

describe('state functions', () => {
  describe('parseUrlState', () => {
    it('returns default state on empty string', () => {
      expect(parseUrlState('')).toMatchObject({
        datasource: null,
        queries: [],
        range: DEFAULT_RANGE,
      });
    });

    it('returns a valid Explore state from URL parameter', () => {
      const paramValue =
        '%7B"datasource":"Local","queries":%5B%7B"expr":"metric"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D';
      expect(parseUrlState(paramValue)).toMatchObject({
        datasource: 'Local',
        queries: [{ expr: 'metric' }],
        range: {
          from: 'now-1h',
          to: 'now',
        },
      });
    });

    it('returns a valid Explore state from a compact URL parameter', () => {
      const paramValue = '%5B"now-1h","now","Local",%7B"expr":"metric"%7D%5D';
      expect(parseUrlState(paramValue)).toMatchObject({
        datasource: 'Local',
        queries: [{ expr: 'metric' }],
        range: {
          from: 'now-1h',
          to: 'now',
        },
      });
    });
  });

  describe('serializeStateToUrlParam', () => {
    it('returns url parameter value for a state object', () => {
      const state = {
        ...DEFAULT_EXPLORE_STATE,
        datasourceName: 'foo',
        range: {
          from: 'now-5h',
          to: 'now',
        },
        initialQueries: [
          {
            refId: '1',
            expr: 'metric{test="a/b"}',
          },
          {
            refId: '2',
            expr: 'super{foo="x/z"}',
          },
        ],
      };
      expect(serializeStateToUrlParam(state)).toBe(
        '{"datasource":"foo","queries":[{"expr":"metric{test=\\"a/b\\"}"},' +
          '{"expr":"super{foo=\\"x/z\\"}"}],"range":{"from":"now-5h","to":"now"}}'
      );
    });

    it('returns url parameter value for a state object', () => {
      const state = {
        ...DEFAULT_EXPLORE_STATE,
        datasourceName: 'foo',
        range: {
          from: 'now-5h',
          to: 'now',
        },
        initialQueries: [
          {
            refId: '1',
            expr: 'metric{test="a/b"}',
          },
          {
            refId: '2',
            expr: 'super{foo="x/z"}',
          },
        ],
      };
      expect(serializeStateToUrlParam(state, true)).toBe(
        '["now-5h","now","foo",{"expr":"metric{test=\\"a/b\\"}"},{"expr":"super{foo=\\"x/z\\"}"}]'
      );
    });
  });

  describe('interplay', () => {
    it('can parse the serialized state into the original state', () => {
      const state = {
        ...DEFAULT_EXPLORE_STATE,
        datasourceName: 'foo',
        range: {
          from: 'now - 5h',
          to: 'now',
        },
        initialQueries: [
          {
            refId: '1',
            expr: 'metric{test="a/b"}',
          },
          {
            refId: '2',
            expr: 'super{foo="x/z"}',
          },
        ],
      };
      const serialized = serializeStateToUrlParam(state);
      const parsed = parseUrlState(serialized);

      // Account for datasource vs datasourceName
      const { datasource, queries, ...rest } = parsed;
      const resultState = {
        ...rest,
        datasource: DEFAULT_EXPLORE_STATE.datasource,
        datasourceName: datasource,
        initialQueries: queries,
      };

      expect(state).toMatchObject(resultState);
    });
  });
});

describe('updateHistory()', () => {
  const datasourceId = 'myDatasource';
  const key = `grafana.explore.history.${datasourceId}`;

  beforeEach(() => {
    clearHistory(datasourceId);
    expect(store.exists(key)).toBeFalsy();
  });

  test('should save history item to localStorage', () => {
    const expected = [
      {
        query: { refId: '1', expr: 'metric' },
      },
    ];
    expect(updateHistory([], datasourceId, [{ refId: '1', expr: 'metric' }])).toMatchObject(expected);
    expect(store.exists(key)).toBeTruthy();
    expect(store.getObject(key)).toMatchObject(expected);
  });
});

describe('hasNonEmptyQuery', () => {
  test('should return true if one query is non-empty', () => {
    expect(hasNonEmptyQuery([{ refId: '1', key: '2', expr: 'foo' }])).toBeTruthy();
  });

  test('should return false if query is empty', () => {
    expect(hasNonEmptyQuery([{ refId: '1', key: '2' }])).toBeFalsy();
  });

  test('should return false if no queries exist', () => {
    expect(hasNonEmptyQuery([])).toBeFalsy();
  });
});
