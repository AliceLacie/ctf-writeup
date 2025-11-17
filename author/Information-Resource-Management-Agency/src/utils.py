from pg8000.converters import literal

def expand_sql(sql: str, params: tuple) -> str:
    expanded = sql
    for i in range(len(params), 0, -1):
        if '$' in literal(params[i-1]):
            return False
        expanded = expanded.replace(f"${i}", literal(params[i - 1]))
    return expanded

def run_sql(conn, sql: str, params: tuple = ()) -> list:
    query = expand_sql(sql, params)
    if query is False:
        return False
    res = conn.run(query)
    return res