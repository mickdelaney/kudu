using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Http;
using Kudu.Contracts.Tracing;
using Kudu.Core.Infrastructure;
using Kudu.Services.Infrastructure;

namespace Kudu.Services.Diagnostics
{
    public class RuntimeController : ApiController
    {
        private const string _versionRegexFormat = @"^{0}\d+\.\d+";
        private static string[] _netFrameworkVersions = new[] { "v2.0", "v4.0" };
        private static string[] _javaContainers = new[] { "Jetty", "Tomcat" };

        private readonly ITracer _tracer;

        public RuntimeController(ITracer tracer)
        {
            _tracer = tracer;
        }

        [HttpGet]
        public RuntimeInfo GetRuntimeVersions()
        {
            using (_tracer.Step("RuntimeController.GetRuntimeVersions"))
            {
                return new RuntimeInfo
                {
                    NetFrameworkVersions = GetNetFrameworkVersions(),
                    NodeVersions = GetNodeVersions(),
                    PhpVersions = GetPhpVersions(),
                    JavaVersions = GetJavaVersions(),
                    JavaContainers = GetJavaContainerVersions(),
                    PythonVersions = GetPythonVersions(),
                    SiteExtensions = GetSiteExtensionVersions()
                };
            }
        }

        // Azure v2.0 => Portal v3.5
        // Azure v4.0 => Portal v4.5
        // OM: SiteConfig's NetFrameworkVersion
        // DB: runtime.Sites' ClrVersion
        public static IEnumerable<string> GetNetFrameworkVersions()
        {
            return _netFrameworkVersions;
        }

        // 0.10.5
        // OM: SiteConfig's AppSettings's WEBSITE_NODE_DEFAULT_VERSION
        // DB: runtime.Sites' Environment's WEBSITE_NODE_DEFAULT_VERSION
        public static IEnumerable<string> GetNodeVersions()
        {
            return GetVersions("nodejs");
        }

        // 5.4 
        // OM: SiteConfig's PhpVersion
        // DB: runtime.Sites' HandlerNames
        public static IEnumerable<string> GetPhpVersions()
        {
            return GetVersions("PHP", prefix: "v", includesOff: true);
        }

        // Off, 1.7.0_51
        // OM: SiteConfig's JavaVersion
        // DB: runtime.Sites' JavaVersion {0}|{1}|{2}
        public static IEnumerable<string> GetJavaVersions()
        {
            return GetVersions("Java", prefix: "jdk", includesOff: true);
        }

        // Enumerate version from ProgramFilesX86\<name>
        private static IEnumerable<string> GetVersions(string name, string prefix = null, bool includesOff = false)
        {
            string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), name);
            var directoryInfo = FileSystemHelpers.DirectoryInfoFromDirectoryName(path);
            if (directoryInfo.Exists)
            {
                var results = directoryInfo.GetDirectories()
                                           .Where(dir => Regex.IsMatch(dir.Name, String.Format(_versionRegexFormat, prefix)))
                                           .Select(dir => String.IsNullOrEmpty(prefix) ? dir.Name : dir.Name.Substring(prefix.Length));

                if (includesOff)
                {
                    results = new[] { String.Empty }.Concat(results);
                }

                return results;
            }

            return Enumerable.Empty<string>();
        }

        // Off, Tomcat, Jetty
        // OM: SiteConfig's JavaContainer
        // DB: runtime.Sites' JavaVersion {0}|{1}|{2}
        // Off, (Tomcat) 7.0.50, (Jetty) 9.1.0.20131115
        // OM: SiteConfig's JavaContainerVersion
        // DB: runtime.Sites' JavaVersion {0}|{1}|{2}
        // ProgramFilesX86\apache-tomcat-7.0.50
        // ProgramFilesX86\jetty-distribution-9.1.0.v20131115
        public static Dictionary<string, IEnumerable<string>> GetJavaContainerVersions()
        {
            var results = new Dictionary<string, IEnumerable<string>>();
            string path = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            var directoryInfo = FileSystemHelpers.DirectoryInfoFromDirectoryName(path);
            foreach (var container in _javaContainers)
            {
                var versions = new List<string>();
                foreach (var dir in directoryInfo.GetDirectories(String.Format("*{0}-*", container)))
                {
                    var version = dir.Name.Split(new[] { '-' }).Last();
                    if (Regex.IsMatch(version, @"^\d+\.\d+"))
                    {
                        // Azure strip out ".v" from version
                        version = version.Replace(".v", ".");

                        versions.Add(version);
                    }
                }
                results[container] = versions;
            }

            return results;
        }

        // 2.7.3
        // OM/DB: not supported
        // this parses the python's readme file
        // an alternative is to run python.exe -V (too heavyweight)
        public static IEnumerable<string> GetPythonVersions()
        {
            string path = VfsSpecialFolders.SystemDrivePath + Path.DirectorySeparatorChar;
            var directoryInfo = FileSystemHelpers.DirectoryInfoFromDirectoryName(path);
            return directoryInfo.GetDirectories("Python*")
                                .Select(dir => GetPythonVersion(dir))
                                .Where(ver => !String.IsNullOrEmpty(ver));
        }

        private static string GetPythonVersion(DirectoryInfoBase dir)
        {
            //This is Python version 2.7.3
            var readme = dir.GetFiles("README.txt").FirstOrDefault();
            if (readme != null)
            {
                using (var reader = readme.OpenText())
                {
                    // This is Python version 2.7.3
                    var line = reader.ReadLine();
                    if (!String.IsNullOrEmpty(line))
                    {
                        return line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Last();
                    }
                }
            }

            return null;
        }

        // OM: SiteConfig's AppSettings's WEBSITE_NODE_DEFAULT_VERSION
        // DB: runtime.Sites' Environment's WEBSITE_NODE_DEFAULT_VERSION
        // ProgramFilesX86\SiteExtensions\Kudu\1.2.3.4
        public static Dictionary<string, IEnumerable<string>> GetSiteExtensionVersions()
        {
            var results = new Dictionary<string, IEnumerable<string>>();
            string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "SiteExtensions");
            var directoryInfo = FileSystemHelpers.DirectoryInfoFromDirectoryName(path);
            if (directoryInfo.Exists)
            {
                foreach (var extension in directoryInfo.GetDirectories())
                {
                    var versions = new List<string>();
                    foreach (var version in extension.GetDirectories())
                    {
                        if (Regex.IsMatch(version.Name, @"^\d+\.\d+"))
                        {
                            versions.Add(version.Name);
                        }
                    }

                    results.Add(extension.Name, versions.ToArray());
                }
            }

            return results;
        }
    }
}
