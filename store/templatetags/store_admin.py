from django import template

register = template.Library()


@register.filter
def link_contains(link, substring):
    """Return True if link (string) contains substring. Used to highlight Tokens link."""
    if not link:
        return False
    return substring in str(link)
